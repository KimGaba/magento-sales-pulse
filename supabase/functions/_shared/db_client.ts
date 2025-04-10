
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { Database } from "./database_types.ts";

const supabaseUrl = "https://vlkcnndgtarduplyedyp.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
