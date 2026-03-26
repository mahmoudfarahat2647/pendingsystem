import { redirect } from "next/navigation";
import { DraftSessionRecoveryHarness } from "@/components/testing/DraftSessionRecoveryHarness";
import { getServerSession } from "@/lib/auth-session";

export default async function DraftSessionTestPage() {
	const session = await getServerSession();
	if (!session) {
		redirect("/login");
	}
	return <DraftSessionRecoveryHarness />;
}
