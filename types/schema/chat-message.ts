import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: {
      // ref to Company and User
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    target: {
      // ref to Company and User
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    hasSeen: {
      type: Boolean,
    },
    seenTimestamp: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", ChatMessageSchema);

export default ChatMessage;
