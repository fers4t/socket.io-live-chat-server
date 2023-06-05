import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
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

const Company =
  mongoose.models.Company || mongoose.model("Company", CompanySchema);

export default Company;
