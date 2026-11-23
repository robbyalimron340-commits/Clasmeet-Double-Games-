
/* =====================================
   NESEMBA E-SPORTS 2026
   PUBLIC TEAM DATABASE
===================================== */

/**
 * @typedef {Object} Participant
 * @property {string} team_name
 * @property {string} game
 * @property {string} class_name
 * @property {string} captain_name
 */

/**
 * @typedef {Object} SupabaseResult
 * @property {Participant[] | null} data
 * @property {Object | null} error
 */

document.addEventListener("DOMContentLoaded", async function () {

    const db = window.NESEMBA_SUPABASE;

    const participantContainer =
        document.querySelector("#participantList");

    const searchInput =
        document.querySelector("#searchTeam");

    const gameFilter =
        document.querySelector("#gameFilter");

    /** @type {Participant[]} */
    let participants = [];

    /**
     * Mengamankan teks HTML.
     * @param {string} value
     * @returns {string}
     */
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    /**
     * Menampilkan daftar tim.
     * @param {Participant[]} data
     */
    function renderParticipants(data) {

        if (!participantContainer) return;

        if (data.length === 0) {
            participantContainer.innerHTML = `
                <div class="empty-participants">
                    <span>📡</span>
                    <h3>BELUM ADA TIM</h3>
                    <p>Belum ada tim yang sesuai dengan pencarian.</p>
                </div>
            `;
            return;
        }

        participantContainer.innerHTML = data.map(
            (/** @type {Participant} */ team) => `
                <div class="participant-card">
                    <h3>${escapeHTML(team.team_name)}</h3>
                    <p>Game: ${escapeHTML(team.game)}</p>
                    <p>Kelas: ${escapeHTML(team.class_name)}</p>
                    <p>Kapten: ${escapeHTML(team.captain_name)}</p>
                </div>
            `
        ).join("");
    }

    // PENCARIAN DAN FILTER
    function filterParticipants() {

        const keyword = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        const selectedGame = gameFilter
            ? gameFilter.value
            : "all";

        const filtered = participants.filter(
            (/** @type {Participant} */ team) => {

                const matchesSearch =
                    (team.team_name || "")
                        .toLowerCase()
                        .includes(keyword);

                const matchesGame =
                    selectedGame === "all" ||
                    team.game === selectedGame;

                return matchesSearch && matchesGame;
            }
        );

        renderParticipants(filtered);
    }

    // MEMUAT DATA DARI SUPABASE
    async function loadParticipants() {

        if (!participantContainer) return;

        if (!db) {
            participantContainer.innerHTML = `
                <div class="empty-participants">
                    <h3>KONEKSI DATABASE GAGAL</h3>
                    <p>Supabase belum berhasil dimuat.</p>
                </div>
            `;

            console.error("Supabase client tidak ditemukan.");
            return;
        }

        const { data, error } = await db
            .from("teams")
            .select("team_name, game, class_name, captain_name")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Gagal memuat tim:", error);

            participantContainer.innerHTML = `
                <div class="empty-participants">
                    <h3>GAGAL MEMUAT DATA</h3>
                    <p>Silakan coba beberapa saat lagi.</p>
                </div>
            `;

            return;
        }

        participants = /** @type {Participant[]} */ (data || []);

        filterParticipants();
    }

    // EVENT PENCARIAN
    if (searchInput) {
        searchInput.addEventListener("input", filterParticipants);
    }

    // EVENT FILTER GAME
    if (gameFilter) {
        gameFilter.addEventListener("change", filterParticipants);
    }

    // JALANKAN SISTEM
    await loadParticipants();

    console.log("NESEMBA PUBLIC TEAM DATABASE ONLINE");

});
