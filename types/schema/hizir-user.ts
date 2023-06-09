import mongoose from "mongoose";

const HizirUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minLength: 1,
      trim: true,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    logo: {
      type: String,
      trim: true,
      required: true,
    },
    userType: {
      type: String,
      enum: "agent" || "company",
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

const HizirUser =
  mongoose.models.HizirUser || mongoose.model("HizirUser", HizirUserSchema);

export default HizirUser;
