import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateOfferPDF = async ({
  offer_id,
  candidate_name,
  position,
  ctc,
  joining_date,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const offersDir = path.join(process.cwd(), "offers");
      if (!fs.existsSync(offersDir)) {
        fs.mkdirSync(offersDir);
      }

      const filePath = path.join(offersDir, `offer_${offer_id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ---- CONTENT ----
      doc.fontSize(20).text("OFFER LETTER", { align: "center" });
      doc.moveDown(2);

      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      doc.text(`Dear ${candidate_name},`);
      doc.moveDown();

      doc.text(
        `We are pleased to offer you the position of ${position} at our organization.

Your annual CTC will be ${ctc}.
Your joining date will be ${new Date(joining_date).toDateString()}.

We look forward to having you on our team.`,
        { align: "justify" }
      );

      doc.moveDown(3);
      doc.text("Sincerely,");
      doc.text("HR Manager");

      // ---- SIGNATURE ----
      const signPath = path.join(process.cwd(), "assets", "WhatsApp Image 2025-12-14 at 11.44.47_5cffaec4.jpg");

      if (fs.existsSync(signPath)) {
        doc.moveDown();
        doc.image(signPath, { width: 120 });
      }

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
