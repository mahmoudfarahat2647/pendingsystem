import { redirect } from "next/navigation";
import { DraftSessionRecoveryHarness } from "@/components/testing/DraftSessionRecoveryHarness";
import { getServerSession } from "@/lib/auth-session";

export default async function DraftSessionTestPage() {
	if (process.env.NODE_ENV === "production") {
		redirect("/");
	}
	const session = await getServerSession();
	if (!session) {
		redirect("/login");
	}
	return <DraftSessionRecoveryHarness />;
}
