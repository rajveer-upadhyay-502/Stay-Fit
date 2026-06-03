import express from 'express';
import mongoose from 'mongoose';
import Report from '../models/Report';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Upload/Create a new medical report
router.post('/', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, title, type, fileUrl, parsedData, date } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }

    if (!title || !type) {
      return res.status(400).json({ error: 'title and type are required' });
    }

    // Authorization: Ensure authenticated user matches target userId
    if (!req.mongoUser || req.mongoUser._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // Default mock data depending on report type if not provided
    let finalParsedData = parsedData;
    if (!finalParsedData) {
      if (type === 'Scan' || type === 'Upload') {
        finalParsedData = {
          'Hemoglobin': '14.5 g/dL (Normal)',
          'Total Cholesterol': '185 mg/dL (Desirable)',
          'Blood Glucose (Fasting)': '92 mg/dL (Normal)',
          'Vitamin D3': '35 ng/mL (Sufficient)',
          'Thyroid Stimulating Hormone (TSH)': '2.1 mIU/L (Normal)',
        };
      } else {
        finalParsedData = {
          'Systolic BP': '120 mmHg',
          'Diastolic BP': '80 mmHg',
          'Heart Rate': '72 bpm',
        };
      }
    }

    const reportDate = date ? new Date(date) : new Date();
    if (isNaN(reportDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const newReport = new Report({
      userId,
      title,
      type,
      fileUrl: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // fallback PDF
      parsedData: finalParsedData,
      date: reportDate,
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get all reports for a specific user
router.get('/:userId', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Authorization: Ensure authenticated user matches target userId
    if (!req.mongoUser || req.mongoUser._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const reports = await Report.find({ userId }).sort({ date: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
