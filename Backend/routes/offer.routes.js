import express from "express";
import {
  createOffer,
  getOffers,
  updateOfferStatus,
  downloadOfferLetter
} from "../controller/offer.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Offer routes
router.post("/", authMiddleware, createOffer);
router.get("/", getOffers);
router.patch("/:id/status", authMiddleware, updateOfferStatus);
router.get("/:id/download", downloadOfferLetter);

export default router;
