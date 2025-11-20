import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { analyzeOpportunity } from '@/lib/ai-analysis';
import { calculateHealthScore } from '@/lib/health-score';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

// Extract text from PDF
async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// POST /api/opportunities/[id]/documents - Upload documents and trigger AI analysis
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const opportunityId = params.id;

    // Verify opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Process and save files
    const uploadedDocuments = [];

    for (const file of files) {
      const fileName = file.name;
      const fileExtension = path.extname(fileName).toLowerCase();

      // Determine document type
      let documentType = 'Other';
      if (fileName.toLowerCase().includes('transcript') || fileExtension === '.txt') {
        documentType = 'Transcript';
      } else if (fileName.toLowerCase().includes('email') || fileExtension === '.pdf') {
        documentType = 'Email Thread';
      }

      // Read file content
      const buffer = Buffer.from(await file.arrayBuffer());

      // Extract text based on file type
      let fileContent = '';
      if (fileExtension === '.txt') {
        fileContent = buffer.toString('utf-8');
      } else if (fileExtension === '.pdf') {
        fileContent = await extractPDFText(buffer);
      } else {
        return NextResponse.json(
          { error: `Unsupported file type: ${fileExtension}` },
          { status: 400 }
        );
      }

      // Save file to disk
      const timestamp = Date.now();
      const safeFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(UPLOAD_DIR, safeFileName);
      await fs.writeFile(filePath, buffer);

      // Create document record
      const document = await prisma.document.create({
        data: {
          opportunityId,
          documentType,
          fileName,
          filePath,
          fileContent,
          processingStatus: 'Pending',
        },
      });

      uploadedDocuments.push(document);
    }

    // Trigger AI analysis in the background
    // Update documents to "Processing" status
    await prisma.document.updateMany({
      where: {
        id: {
          in: uploadedDocuments.map(d => d.id),
        },
      },
      data: {
        processingStatus: 'Processing',
      },
    });

    // Perform AI analysis
    try {
      // Fetch all documents for this opportunity
      const allDocuments = await prisma.document.findMany({
        where: {
          opportunityId,
        },
        select: {
          fileName: true,
          fileContent: true,
          documentType: true,
        },
      });

      // Prepare analysis context
      const analysisContext = {
        accountName: opportunity.account.name,
        opportunityName: opportunity.name,
        currentStage: opportunity.currentStage,
        documents: allDocuments,
      };

      // Run AI analysis
      const analysisResult = await analyzeOpportunity(analysisContext);

      // Update MEDDPICC analysis
      await prisma.mEDDPICCAnalysis.upsert({
        where: {
          opportunityId,
        },
        create: {
          opportunityId,
          metricsValue: analysisResult.meddpicc.metrics.value,
          metricsConfidence: analysisResult.meddpicc.metrics.confidence,
          metricsSources: JSON.stringify(analysisResult.meddpicc.metrics.sources),

          economicBuyerValue: analysisResult.meddpicc.economicBuyer.value,
          economicBuyerConfidence: analysisResult.meddpicc.economicBuyer.confidence,
          economicBuyerSources: JSON.stringify(analysisResult.meddpicc.economicBuyer.sources),

          decisionCriteriaValue: analysisResult.meddpicc.decisionCriteria.value,
          decisionCriteriaConfidence: analysisResult.meddpicc.decisionCriteria.confidence,
          decisionCriteriaSources: JSON.stringify(analysisResult.meddpicc.decisionCriteria.sources),

          decisionProcessValue: analysisResult.meddpicc.decisionProcess.value,
          decisionProcessConfidence: analysisResult.meddpicc.decisionProcess.confidence,
          decisionProcessSources: JSON.stringify(analysisResult.meddpicc.decisionProcess.sources),

          painValue: analysisResult.meddpicc.pain.value,
          painConfidence: analysisResult.meddpicc.pain.confidence,
          painSources: JSON.stringify(analysisResult.meddpicc.pain.sources),

          championValue: analysisResult.meddpicc.champion.value,
          championConfidence: analysisResult.meddpicc.champion.confidence,
          championSources: JSON.stringify(analysisResult.meddpicc.champion.sources),

          competitionValue: analysisResult.meddpicc.competition.value,
          competitionConfidence: analysisResult.meddpicc.competition.confidence,
          competitionSources: JSON.stringify(analysisResult.meddpicc.competition.sources),
        },
        update: {
          metricsValue: analysisResult.meddpicc.metrics.value,
          metricsConfidence: analysisResult.meddpicc.metrics.confidence,
          metricsSources: JSON.stringify(analysisResult.meddpicc.metrics.sources),
          metricsUpdated: new Date(),

          economicBuyerValue: analysisResult.meddpicc.economicBuyer.value,
          economicBuyerConfidence: analysisResult.meddpicc.economicBuyer.confidence,
          economicBuyerSources: JSON.stringify(analysisResult.meddpicc.economicBuyer.sources),
          economicBuyerUpdated: new Date(),

          decisionCriteriaValue: analysisResult.meddpicc.decisionCriteria.value,
          decisionCriteriaConfidence: analysisResult.meddpicc.decisionCriteria.confidence,
          decisionCriteriaSources: JSON.stringify(analysisResult.meddpicc.decisionCriteria.sources),
          decisionCriteriaUpdated: new Date(),

          decisionProcessValue: analysisResult.meddpicc.decisionProcess.value,
          decisionProcessConfidence: analysisResult.meddpicc.decisionProcess.confidence,
          decisionProcessSources: JSON.stringify(analysisResult.meddpicc.decisionProcess.sources),
          decisionProcessUpdated: new Date(),

          painValue: analysisResult.meddpicc.pain.value,
          painConfidence: analysisResult.meddpicc.pain.confidence,
          painSources: JSON.stringify(analysisResult.meddpicc.pain.sources),
          painUpdated: new Date(),

          championValue: analysisResult.meddpicc.champion.value,
          championConfidence: analysisResult.meddpicc.champion.confidence,
          championSources: JSON.stringify(analysisResult.meddpicc.champion.sources),
          championUpdated: new Date(),

          competitionValue: analysisResult.meddpicc.competition.value,
          competitionConfidence: analysisResult.meddpicc.competition.confidence,
          competitionSources: JSON.stringify(analysisResult.meddpicc.competition.sources),
          competitionUpdated: new Date(),
        },
      });

      // Update BANT analysis
      await prisma.bANTAnalysis.upsert({
        where: {
          opportunityId,
        },
        create: {
          opportunityId,
          budgetValue: analysisResult.bant.budget.value,
          budgetConfidence: analysisResult.bant.budget.confidence,
          budgetSources: JSON.stringify(analysisResult.bant.budget.sources),

          authorityValue: analysisResult.bant.authority.value,
          authorityConfidence: analysisResult.bant.authority.confidence,
          authoritySources: JSON.stringify(analysisResult.bant.authority.sources),

          needValue: analysisResult.bant.need.value,
          needConfidence: analysisResult.bant.need.confidence,
          needSources: JSON.stringify(analysisResult.bant.need.sources),

          timelineValue: analysisResult.bant.timeline.value,
          timelineConfidence: analysisResult.bant.timeline.confidence,
          timelineSources: JSON.stringify(analysisResult.bant.timeline.sources),
        },
        update: {
          budgetValue: analysisResult.bant.budget.value,
          budgetConfidence: analysisResult.bant.budget.confidence,
          budgetSources: JSON.stringify(analysisResult.bant.budget.sources),
          budgetUpdated: new Date(),

          authorityValue: analysisResult.bant.authority.value,
          authorityConfidence: analysisResult.bant.authority.confidence,
          authoritySources: JSON.stringify(analysisResult.bant.authority.sources),
          authorityUpdated: new Date(),

          needValue: analysisResult.bant.need.value,
          needConfidence: analysisResult.bant.need.confidence,
          needSources: JSON.stringify(analysisResult.bant.need.sources),
          needUpdated: new Date(),

          timelineValue: analysisResult.bant.timeline.value,
          timelineConfidence: analysisResult.bant.timeline.confidence,
          timelineSources: JSON.stringify(analysisResult.bant.timeline.sources),
          timelineUpdated: new Date(),
        },
      });

      // Create AI insights
      await prisma.aIInsight.create({
        data: {
          opportunityId,
          redFlags: JSON.stringify(analysisResult.redFlags),
          nextActions: JSON.stringify(analysisResult.nextActions),
          stakeholderGaps: analysisResult.stakeholderGaps,
          stakeholderGapsConfidence: analysisResult.stakeholderGapsConfidence || 0,
          budgetTimelineSignals: analysisResult.budgetTimelineSignals,
          budgetTimelineSignalsConfidence: analysisResult.budgetTimelineSignalsConfidence || 0,
          painPointQualification: analysisResult.painPointQualification,
          painPointQualificationConfidence: analysisResult.painPointQualificationConfidence || 0,
          competitiveIntelligence: analysisResult.competitiveIntelligence,
          competitiveIntelligenceConfidence: analysisResult.competitiveIntelligenceConfidence || 0,
          stageRecommendation: analysisResult.stageRecommendation,
          stageRecommendationRationale: analysisResult.stageRecommendationRationale,
          stageRecommendationConfidence: analysisResult.stageRecommendationConfidence || 0,
        },
      });

      // Calculate health score
      const healthScore = calculateHealthScore({
        meddpicc: {
          metricsConfidence: analysisResult.meddpicc.metrics.confidence,
          economicBuyerConfidence: analysisResult.meddpicc.economicBuyer.confidence,
          decisionCriteriaConfidence: analysisResult.meddpicc.decisionCriteria.confidence,
          decisionProcessConfidence: analysisResult.meddpicc.decisionProcess.confidence,
          painConfidence: analysisResult.meddpicc.pain.confidence,
          championConfidence: analysisResult.meddpicc.champion.confidence,
          competitionConfidence: analysisResult.meddpicc.competition.confidence,
        },
        bant: {
          budgetConfidence: analysisResult.bant.budget.confidence,
          authorityConfidence: analysisResult.bant.authority.confidence,
          needConfidence: analysisResult.bant.need.confidence,
          timelineConfidence: analysisResult.bant.timeline.confidence,
        },
        redFlags: analysisResult.redFlags,
      });

      // Create analysis snapshot for historical tracking
      const meddpiccData = await prisma.mEDDPICCAnalysis.findUnique({
        where: { opportunityId },
      });
      const bantData = await prisma.bANTAnalysis.findUnique({
        where: { opportunityId },
      });

      await prisma.analysisSnapshot.create({
        data: {
          opportunityId,
          meddpiccSnapshot: JSON.stringify({
            metrics: analysisResult.meddpicc.metrics.confidence,
            economicBuyer: analysisResult.meddpicc.economicBuyer.confidence,
            decisionCriteria: analysisResult.meddpicc.decisionCriteria.confidence,
            decisionProcess: analysisResult.meddpicc.decisionProcess.confidence,
            pain: analysisResult.meddpicc.pain.confidence,
            champion: analysisResult.meddpicc.champion.confidence,
            competition: analysisResult.meddpicc.competition.confidence,
          }),
          bantSnapshot: JSON.stringify({
            budget: analysisResult.bant.budget.confidence,
            authority: analysisResult.bant.authority.confidence,
            need: analysisResult.bant.need.confidence,
            timeline: analysisResult.bant.timeline.confidence,
          }),
          healthScore,
        },
      });

      // Update opportunity with health score and last analyzed timestamp
      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          overallHealthScore: healthScore,
          lastAnalyzed: new Date(),
        },
      });

      // Mark documents as completed
      await prisma.document.updateMany({
        where: {
          id: {
            in: uploadedDocuments.map(d => d.id),
          },
        },
        data: {
          processingStatus: 'Completed',
        },
      });

      return NextResponse.json({
        success: true,
        documentsUploaded: uploadedDocuments.length,
        healthScore,
        redFlagsCount: analysisResult.redFlags.length,
        nextActionsCount: analysisResult.nextActions.length,
      });

    } catch (analysisError) {
      console.error('AI Analysis Error:', analysisError);

      // Mark documents as error
      await prisma.document.updateMany({
        where: {
          id: {
            in: uploadedDocuments.map(d => d.id),
          },
        },
        data: {
          processingStatus: 'Error',
        },
      });

      return NextResponse.json(
        {
          error: 'Documents uploaded but AI analysis failed',
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}

// GET /api/opportunities/[id]/documents - Get all documents for an opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        opportunityId: params.id,
      },
      orderBy: {
        uploadDate: 'desc',
      },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        uploadDate: true,
        processingStatus: true,
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
