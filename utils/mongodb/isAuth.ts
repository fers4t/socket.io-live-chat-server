import HizirUser from "@/types/schema/hizir-user";
import { dbConnect } from "./mongodb";
import signale from "@/lib/signale";

export async function isAuth(id: string) {
  await dbConnect();

  try {
    const checkCompany = await HizirUser.findOne({ _id: id });
    if (checkCompany) {
      signale.authentication(`${checkCompany.name} is a company, connected.`);
      return checkCompany;
    }
  } catch (error) {
    signale.error(`${id} is not company, disconnected.`);
    return Promise.reject(new Error("invalid company"));
  }
}
