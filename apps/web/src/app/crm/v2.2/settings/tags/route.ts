import { tagsBinRoute } from "@/server/tags-bin/route";

export const dynamic = "force-dynamic";

export const GET = tagsBinRoute("tags");
export const POST = tagsBinRoute("create");
