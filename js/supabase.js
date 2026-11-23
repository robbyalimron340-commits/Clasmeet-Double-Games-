
const SUPABASE_URL = "https://rxtbsyagczzybbugdten.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_S5jK8-zQVnzRvzIcQGgNhQ_eJ1tzWLa";

if (!window.supabase) {
    console.error("Supabase SDK belum dimuat.");
} else {
    window.NESEMBA_SUPABASE = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("Konfigurasi Supabase berhasil dimuat.");
}
