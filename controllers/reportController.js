const Shipment = require('../models/Shipment');

// Reports use Lagos time for day/month boundaries
const TZ = 'Africa/Lagos';
const TZ_OFFSET = '+01:00';
const DAY_MS = 24 * 60 * 60 * 1000;
const isDateString = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

// When a shipment was delivered: deliveredAt (set since status rules were added), else the
// latest "delivered" entry in its tracking history (older shipments)
const deliveredTimestamp = {
  $ifNull: [
    '$deliveredAt',
    {
      $max: {
        $map: {
          input: {
            $filter: {
              input: { $ifNull: ['$trackingHistory', []] },
              cond: { $eq: [{ $toLower: { $trim: { input: { $ifNull: ['$$this.status', ''] } } } }, 'delivered'] },
            },
          },
          in: '$$this.timestamp',
        },
      },
    },
  ],
};
const isDeliveredExpr = { $eq: [{ $toLower: { $trim: { input: { $ifNull: ['$status', ''] } } } }, 'delivered'] };
const facilityExpr = { $ifNull: ['$shipmentFacility', 'Unassigned'] };

// GET /api/reports/shipments?from=YYYY-MM-DD&to=YYYY-MM-DD&facility=Name (Admin/Employee)
exports.getShipmentReport = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const toStr = isDateString(req.query.to) ? req.query.to : today;
    const fromStr = isDateString(req.query.from)
      ? req.query.from
      : new Date(Date.parse(`${toStr}T00:00:00${TZ_OFFSET}`) - 29 * DAY_MS).toISOString().slice(0, 10);

    const from = new Date(`${fromStr}T00:00:00${TZ_OFFSET}`);
    const to = new Date(Date.parse(`${toStr}T00:00:00${TZ_OFFSET}`) + DAY_MS); // exclusive
    if (!(from < to)) return res.status(400).json({ message: '"from" must be on or before "to".' });
    if (to - from > 366 * 2 * DAY_MS) return res.status(400).json({ message: 'Date range can be at most two years.' });

    // Up to ~2 months: daily buckets; longer: monthly
    const granularity = to - from <= 62 * DAY_MS ? 'day' : 'month';
    const bucketFormat = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';
    const bucketOf = (dateExpr) => ({ $dateToString: { format: bucketFormat, date: dateExpr, timezone: TZ } });

    const facility = typeof req.query.facility === 'string' && req.query.facility.trim() ? req.query.facility.trim() : null;
    const facilityMatch = facility ? { shipmentFacility: facility } : {};

    const [result] = await Shipment.aggregate([
      { $match: facilityMatch },
      {
        $project: {
          createdAt: 1,
          facility: facilityExpr,
          cost: { $ifNull: ['$cost', 0] },
          amountPaid: { $ifNull: ['$amountPaid', 0] },
          isDelivered: isDeliveredExpr,
          deliveredTs: deliveredTimestamp,
          status: 1,
          payments: { $ifNull: ['$payments', []] },
        },
      },
      {
        $facet: {
          // Shipments created in the period
          created: [
            { $match: { createdAt: { $gte: from, $lt: to } } },
            {
              $group: {
                _id: { facility: '$facility', bucket: bucketOf('$createdAt') },
                count: { $sum: 1 },
                billed: { $sum: '$cost' },
              },
            },
          ],
          // Shipments delivered in the period (by delivery time)
          delivered: [
            { $match: { isDelivered: true, deliveredTs: { $gte: from, $lt: to } } },
            {
              $group: {
                _id: '$facility',
                count: { $sum: 1 },
                totalDays: { $sum: { $divide: [{ $subtract: ['$deliveredTs', '$createdAt'] }, DAY_MS] } },
              },
            },
          ],
          // Payments received in the period (by payment date)
          collected: [
            { $unwind: '$payments' },
            { $match: { 'payments.paidAt': { $gte: from, $lt: to } } },
            {
              $group: {
                _id: { facility: '$facility', bucket: bucketOf('$payments.paidAt') },
                amount: { $sum: '$payments.amount' },
                count: { $sum: 1 },
              },
            },
          ],
          // Outstanding balance right now (not limited to the period)
          outstanding: [
            { $match: { cost: { $gt: 0 } } },
            { $project: { facility: 1, balance: { $max: [{ $subtract: ['$cost', '$amountPaid'] }, 0] } } },
            { $match: { balance: { $gt: 0 } } },
            { $group: { _id: '$facility', balance: { $sum: '$balance' }, count: { $sum: 1 } } },
          ],
          // Shipments currently not delivered
          open: [
            { $match: { isDelivered: false } },
            { $group: { _id: '$facility', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    // Fill every bucket in the range so the charts have no gaps
    const buckets = [];
    const cursor = new Date(from);
    const fmt = (d) => {
      const local = new Date(d.getTime() + 60 * 60 * 1000); // shift to Lagos (UTC+1, no DST)
      const iso = local.toISOString();
      return granularity === 'day' ? iso.slice(0, 10) : iso.slice(0, 7);
    };
    while (cursor < to) {
      const key = fmt(cursor);
      if (buckets[buckets.length - 1] !== key) buckets.push(key);
      cursor.setTime(cursor.getTime() + DAY_MS);
    }

    const series = Object.fromEntries(buckets.map((b) => [b, { bucket: b, created: 0, collected: 0 }]));
    const byFacility = {};
    const fac = (name) => {
      byFacility[name] ??= { facility: name, created: 0, billed: 0, delivered: 0, totalDeliveryDays: 0, collected: 0, outstanding: 0, open: 0 };
      return byFacility[name];
    };

    result.created.forEach(({ _id, count, billed }) => {
      if (series[_id.bucket]) series[_id.bucket].created += count;
      const f = fac(_id.facility); f.created += count; f.billed += billed;
    });
    result.collected.forEach(({ _id, amount }) => {
      if (series[_id.bucket]) series[_id.bucket].collected += amount;
      fac(_id.facility).collected += amount;
    });
    result.delivered.forEach(({ _id, count, totalDays }) => {
      const f = fac(_id); f.delivered += count; f.totalDeliveryDays += totalDays;
    });
    result.outstanding.forEach(({ _id, balance }) => { fac(_id).outstanding += balance; });
    result.open.forEach(({ _id, count }) => { fac(_id).open += count; });

    const round2 = (n) => Math.round(n * 100) / 100;
    const facilities = Object.values(byFacility)
      .map(({ totalDeliveryDays, ...f }) => ({
        ...f,
        billed: round2(f.billed),
        collected: round2(f.collected),
        outstanding: round2(f.outstanding),
        avgDeliveryDays: f.delivered ? Math.round((totalDeliveryDays / f.delivered) * 10) / 10 : null,
      }))
      .sort((a, b) => b.created - a.created || b.collected - a.collected);

    const sum = (key) => facilities.reduce((t, f) => t + (f[key] || 0), 0);
    const totalDeliveryDays = result.delivered.reduce((t, d) => t + d.totalDays, 0);
    const deliveredCount = sum('delivered');

    res.json({
      range: { from: fromStr, to: toStr, granularity, timezone: TZ },
      facility,
      totals: {
        created: sum('created'),
        billed: round2(sum('billed')),
        delivered: deliveredCount,
        avgDeliveryDays: deliveredCount ? Math.round((totalDeliveryDays / deliveredCount) * 10) / 10 : null,
        collected: round2(sum('collected')),
        paymentsCount: result.collected.reduce((t, c) => t + c.count, 0),
        outstanding: round2(sum('outstanding')),
        outstandingShipments: result.outstanding.reduce((t, o) => t + o.count, 0),
        open: sum('open'),
      },
      series: buckets.map((b) => ({ ...series[b], collected: round2(series[b].collected) })),
      facilities,
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ message: err.message });
  }
};
