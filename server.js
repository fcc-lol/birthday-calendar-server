import express from "express";
import ical from "node-ical";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3108;

app.get("/", async (req, res) => {
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
          eventDate.setFullYear(today.getFullYear() + 1);
        }

        return {
          name: event.summary,
          date: eventDate.toISOString().split("T")[0]
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
