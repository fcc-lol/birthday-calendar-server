import express from "express";
import ical from "node-ical";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3103;

const formatName = (name) => {
  let formatted = name.replace("'s Birthday", "");
  formatted = formatted.replace("’s Birthday", "");
  return formatted;
};

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.query.fccApiKey;
  if (!apiKey || apiKey !== process.env.FCC_API_KEY) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  next();
};

app.get("/", checkApiKey, async (req, res) => {
  try {
    const icsUrl = process.env.CALENDAR_URL;

    const events = await new Promise((resolve, reject) => {
      ical.fromURL(icsUrl, {}, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formattedEvents = Object.values(events)
      .filter((event) => event.type === "VEVENT")
      .map((event) => {
        const eventDate = new Date(event.start);
        const compareDate = new Date(
          today.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        );

        // If the date is in the past, move it to next year
        if (compareDate < today) {
          compareDate.setFullYear(today.getFullYear() + 1);
        }

        return {
          name: formatName(event.summary),
          date: compareDate.toISOString().split("T")[0]
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });

    res.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
