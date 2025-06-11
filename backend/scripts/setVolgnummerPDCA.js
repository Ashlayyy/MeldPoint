require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Define schemas based on Prisma schema
const preventiefSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    VolgNummer: { type: Number, unique: true },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date },
    Deadline: String,
    // Other fields from Prisma schema that we don't need for this script
    // but including them for proper schema definition
    Teamleden: { IDs: [String] },
    CorrespondenceIDs: { IDs: String },
    rootCauseLevel: { type: Number, default: 2 },
    Kernoorzaak: String,
    Why: mongoose.Schema.Types.Mixed,
    Title: String,
    Conclusie: String,
    StatusID: mongoose.Schema.Types.ObjectId,
    ActiehouderID: mongoose.Schema.Types.ObjectId,
    BegeleiderID: mongoose.Schema.Types.ObjectId,
    CreatedByID: mongoose.Schema.Types.ObjectId
  },
  {
    strict: false,
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' }
  }
);

const volgNummerSchema = new mongoose.Schema(
  {
    _id: String,
    Type: String,
    VolgNummer: Number,
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' }
  }
);

const Preventief = mongoose.model('Preventief', preventiefSchema, 'Preventief');
const VolgNummer = mongoose.model('VolgNummer', volgNummerSchema, 'VolgNummer');

const BATCH_SIZE = 100; // Number of documents to process at once

async function listCollections() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections in database:');
    console.log('=================================');
    collections.sort((a, b) => a.name.localeCompare(b.name));

    // Get document counts for all collections
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        return { name: collection.name, count };
      })
    );

    // Calculate padding for alignment
    const maxNameLength = Math.max(...collectionStats.map((col) => col.name.length));
    const maxCountLength = Math.max(...collectionStats.map((col) => col.count.toString().length));

    collectionStats.forEach((collection, index) => {
      const paddedName = collection.name.padEnd(maxNameLength);
      const paddedCount = collection.count.toString().padStart(maxCountLength);
      console.log(`${(index + 1).toString().padStart(3)}. ${paddedName} | ${paddedCount} documents`);
    });
    console.log('=================================\n');
  } catch (err) {
    console.error('Error listing collections:', err);
  }
}

async function updateBatch(docs, startVolgNummer) {
  console.log(`\nUpdating batch of ${docs.length} documents starting from VolgNummer ${startVolgNummer}`);

  const bulkOps = docs.map((doc, index) => {
    const newVolgNummer = startVolgNummer + index;
    const docId = new ObjectId(doc._id);
    console.log(`Setting document ${docId} to VolgNummer: ${newVolgNummer}`);

    return {
      updateOne: {
        filter: { _id: docId },
        update: {
          $set: {
            VolgNummer: newVolgNummer,
            UpdatedAt: new Date()
          }
        }
      }
    };
  });

  try {
    // First verify we can find the documents
    for (const doc of docs) {
      const docId = new ObjectId(doc._id);
      const exists = await Preventief.findOne({ _id: docId }).lean();
      console.log(`Document ${doc._id} exists in DB: ${!!exists}`);
      if (exists) {
        console.log('Found document:', exists);
      }
    }

    console.log('\nExecuting bulk write operation...');
    const result = await Preventief.bulkWrite(bulkOps);
    console.log(`Bulk write result:`, result);

    // Verify the updates immediately after
    for (const doc of docs) {
      const docId = new ObjectId(doc._id);
      const updated = await Preventief.findOne({ _id: docId }).lean();
      console.log(`Document ${doc._id} after update:`, updated?.VolgNummer);
    }

    return result;
  } catch (error) {
    console.error('Error in bulk write:', error);
    throw error;
  }
}

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL_DEV not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('\nConnected to MongoDB');

    // Debug: Check if we can access the collection directly
    const db = mongoose.connection.db;
    const collection = db.collection('Preventief');
    const count = await collection.countDocuments();
    console.log(`Direct collection count: ${count}`);

    // Debug: Log the model information
    console.log('Model info:', {
      modelName: Preventief.modelName,
      collectionName: Preventief.collection.name,
      baseModelName: Preventief.baseModelName
    });

    // List all collections
    await listCollections();

    // Debug: Try direct collection find
    const rawDocs = await collection.find({}).toArray();
    console.log(`Found ${rawDocs.length} documents using direct collection access`);

    // Original Mongoose find
    const docs = await Preventief.find().lean();
    const totalDocs = docs.length;
    console.log(`Found ${totalDocs} documents using Mongoose model`);

    let processedCount = 0;
    let currentVolgNummer = 1;
    let lastBatchSize = 0;

    // Process in batches
    do {
      console.log(`\nProcessing batch: skip=${processedCount}, limit=${BATCH_SIZE}`);
      const batchDocs = await Preventief.find().sort({ CreatedAt: 1 }).skip(processedCount).limit(BATCH_SIZE).lean();

      lastBatchSize = batchDocs.length;
      if (lastBatchSize > 0) {
        const result = await updateBatch(batchDocs, currentVolgNummer);
        processedCount += lastBatchSize;
        currentVolgNummer += lastBatchSize;
        console.log(`Processed ${processedCount}/${totalDocs} documents`);
      }
    } while (lastBatchSize === BATCH_SIZE);

    // Update VolgNummer collection with the last number
    const lastVolgNummer = currentVolgNummer - 1;
    const now = new Date();

    console.log(`\nUpdating VolgNummer collection with last number: ${lastVolgNummer}`);
    const volgNummerResult = await VolgNummer.findOneAndUpdate(
      { Type: 'preventiefVolgNummer' },
      {
        $set: {
          VolgNummer: lastVolgNummer,
          UpdatedAt: now
        },
        $setOnInsert: {
          CreatedAt: now
        }
      },
      { upsert: true, new: true }
    );
    console.log('VolgNummer update result:', volgNummerResult);

    // Verify updates
    console.log('\nVerifying updates...');
    const verifyDocs = await Preventief.find({ VolgNummer: { $exists: true } })
      .sort({ VolgNummer: 1 })
      .lean();
    console.log(`Found ${verifyDocs.length} documents with VolgNummer set`);
    if (verifyDocs.length > 0) {
      console.log('First document VolgNummer:', verifyDocs[0].VolgNummer);
      console.log('Last document VolgNummer:', verifyDocs[verifyDocs.length - 1].VolgNummer);
    }

    console.log(`\nCompleted! Last VolgNummer: ${lastVolgNummer}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
