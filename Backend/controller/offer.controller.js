import pool from "../db/db.js";
import { generateOfferPDF } from "../utils/generateOfferPdf.js";
import path from "path";
import fs from "fs";

// Create a new offer letter (Admin only)
export const createOffer = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { application_id, position, ctc, joining_date } = req.body;
    const appRes = await pool.query(
      "SELECT name FROM applications WHERE id=$1",
      [application_id]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const candidate_name = appRes.rows[0].name;

    const result = await pool.query(
      `INSERT INTO offer_letters
       (application_id, position, ctc, joining_date)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [application_id, position, ctc, joining_date]
    );
    const offer = result.rows[0];
    
    const pdfPath = await generateOfferPDF({
      offer_id: offer.id,
      candidate_name,
      position,
      ctc,
      joining_date,
    });

    res.status(201).json({
      message: "Offer letter generated",
      pdf: pdfPath,
      offer: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Offer creation failed" });
  }
};

// Download offer letter PDF
export const downloadOfferLetter = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("The id is : ",id);

    const pdfPath = path.join(process.cwd(), "offers", `offer_${id}.pdf`);
    

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: "PDF not found" });
    }

    res.download(pdfPath, `Offer_Letter_${id}.pdf`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Download failed" });
  }
};

// Get all offers
export const getOffers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, a.name AS candidate_name
      FROM offer_letters o
      JOIN applications a ON a.id = o.application_id
      ORDER BY o.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Fetching offers failed" });
  }
};

// Update offer status (Admin only)
export const updateOfferStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { status } = req.body;
    const { id } = req.params;

    await pool.query("UPDATE offer_letters SET status=$1 WHERE id=$2", [
      status,
      id,
    ]);

    res.json({ message: "Offer status updated" });
  } catch (error) {
    res.status(500).json({ message: "Status update failed" });
  }
};
