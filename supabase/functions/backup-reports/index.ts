import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req: Request) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
        // هنا المفروض يكون كود الـ Resend بتاعك
        // جرب تبعت رد بسيط الأول عشان نتأكد إن الزرار شغال
        return new Response(
            JSON.stringify({ message: "الطلب وصل يا ريس والسيستم شغال!" }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                },
                status: 200
            }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || "Unknown error" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400
            }
        )
    }
})