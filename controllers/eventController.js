const Event = require('../models/Event');
const sendMail = require('../utils/mailer');

// --- Helper functions for date calculations ---
// Adds days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Adds weeks to a date
const addWeeks = (date, weeks) => {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
};

// Adds months to a date
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Gets the Nth day of the week in a given month/year
const getNthDayOfMonth = (year, month, dayOfWeek, ordinal) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(dayOfWeek.toLowerCase());
  if (dayIndex === -1) return null;

  let count = 0;
  let targetDate = null;

  // Find all occurrences of dayOfWeek in the month
  const occurrences = [];
  for (let i = 1; i <= 31; i++) {
    const d = new Date(year, month, i);
    if (d.getMonth() !== month) break; // Exceeded month
    if (d.getDay() === dayIndex) {
      occurrences.push(d);
    }
  }

  if (ordinal === 'first' && occurrences.length >= 1) return occurrences[0];
  if (ordinal === 'second' && occurrences.length >= 2) return occurrences[1];
  if (ordinal === 'third' && occurrences.length >= 3) return occurrences[2];
  if (ordinal === 'fourth' && occurrences.length >= 4) return occurrences[3];
  if (ordinal === 'last' && occurrences.length >= 1) return occurrences[occurrences.length - 1];

  return null; // No such day found
};

// --- End Helper functions ---

exports.createEvent = async (req, res) => {
  try {
    const {
      eventTitle, category, description, location, duration, time, date, address, organizer, coOrganizer,
      isRecurring, recurrenceType, recurrenceEndDate, recurrenceDetails
    } = req.body;

    const baseEventData = {
      eventTitle, category, description, location, duration, time, address, organizer, coOrganizer,
      status: 'upcoming' 
    };

    let eventsToCreate = [];
    const startDate = new Date(date); // Convert initial date string to Date object

    if (isRecurring) {
      let currentDate = new Date(startDate);
      const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : addMonths(startDate, 12); // Default to 1 year if no end date

      // Ensure endDate is at least the startDate
      if (endDate < startDate) {
        return res.status(400).json({ message: 'Recurrence end date cannot be before start date.' });
      }

      const originalEvent = new Event({ ...baseEventData, date: startDate, isRecurring: true, recurrenceType, recurrenceEndDate, recurrenceDetails });
      await originalEvent.save(); // Save the first instance as the "parent"
      eventsToCreate.push(originalEvent);

      let nextDate = new Date(startDate); // Start from the initial date for iteration

      while (nextDate <= endDate) {
        if (eventsToCreate.length > 365) { // Safety break to prevent infinite loops or too many events
          console.warn("Stopped generating recurring events after 365 instances.");
          break;
        }

        switch (recurrenceType) {
          case 'daily':
            nextDate = addDays(nextDate, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(nextDate, 1);
            break;
          case 'monthly_date':
            // For monthly_date, we need to ensure we don't skip months if the day doesn't exist
            // e.g., if original date is Jan 31, next should be Feb 28/29, then Mar 31.
            const originalDayOfMonth = startDate.getDate();
            nextDate = addMonths(nextDate, 1);
            // If the next month doesn't have the original day, set to last day of next month
            const lastDayOfNextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
            if (originalDayOfMonth > lastDayOfNextMonth) {
                nextDate.setDate(lastDayOfNextMonth);
            } else {
                nextDate.setDate(originalDayOfMonth); // Reset to original day of month
            }
            break;
          case 'monthly_day':
            if (!recurrenceDetails || !recurrenceDetails.dayOfWeek || !recurrenceDetails.ordinal) {
              return res.status(400).json({ message: 'Recurrence details (dayOfWeek, ordinal) are required for monthly_day recurrence.' });
            }
            // Move to the next month first, then find the specific day
            let tempDate = addMonths(nextDate, 1);
            let calculatedDate = getNthDayOfMonth(
              tempDate.getFullYear(),
              tempDate.getMonth(),
              recurrenceDetails.dayOfWeek,
              recurrenceDetails.ordinal
            );
            if (calculatedDate) {
              nextDate = calculatedDate;
            } else {
                break; // Exit loop if cannot find
            }
            break;
          default:
            return res.status(400).json({ message: 'Invalid recurrence type.' });
        }

        // Only add event if it's within the end date and after the start date (to avoid duplicates if nextDate calculation is tricky)
        if (nextDate <= endDate && nextDate > eventsToCreate[eventsToCreate.length - 1].date) {
            eventsToCreate.push(new Event({
                ...baseEventData,
                date: nextDate,
                isRecurring: true,
                recurrenceType,
                recurrenceEndDate,
                recurrenceDetails,
                parentEventId: originalEvent._id // Link to the original event
            }));
        } else if (nextDate > endDate) {
            break; // Stop if we've gone past the end date
        }
      }
      // Save all generated instances in bulk
      await Event.insertMany(eventsToCreate.slice(1)); // Skip the first one as it's already saved
      res.status(201).json({ message: 'Recurring events created successfully!', events: eventsToCreate });

    } else {
      // Not recurring, create a single event
      const event = new Event({ ...baseEventData, date: startDate, isRecurring: false });
      await event.save();
      res.status(201).json(event);
    }

    // TODO: Send email to subscribers when a new event is added (consider if for each instance or just the series)
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter by status 'upcoming' AND date greater than or equal to today
    const events = await Event.find({
      status: 'upcoming',
      date: { $gte: today } // $gte means "greater than or equal to"
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllEventsForAdmin = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changeEventStatus = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
