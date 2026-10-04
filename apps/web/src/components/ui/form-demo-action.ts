"use server";
import { ValidationError } from "@crm/core/errors";
import { type ActionState, toActionState } from "@/lib/action";

export async function submitFormAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const email = formData.get("email");
  try {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new ValidationError(
        { email: ["Invalid email address"] },
        "Please check the form fields.",
      );
    }
    return { status: "success", message: "Successfully submitted!" };
  } catch (error) {
    return toActionState(error);
  }
}
