
document.addEventListener("DOMContentLoaded", () => {
    const db = window.NESEMBA_SUPABASE;

    const isFF = document.getElementById("ff-registration-form");
    const isML = document.getElementById("ml-registration-form");
    const form = isFF || isML;

    if (!form) return;

    // HALAMAN HASIL REGISTRASI
    /**
 * @param {"success" | "failed"} status
 * @param {string} [reason]
 */
function showResult(status, reason = "") {
        const params = new URLSearchParams();

        params.set("status", status);

        if (reason) {
            params.set("reason", reason);
        }

        window.location.href =
            "registration-result.html?" + params.toString();
    }

    // PERIKSA KONEKSI DATABASE
    if (!db) {
        showResult("failed", "Koneksi database tidak tersedia.");
        return;
    }

    const game = isFF ? "Free Fire" : "Mobile Legends";
    const totalPlayers = isFF ? 4 : 5;

    // BATASI ROLE MOBILE LEGENDS
    if (isML) {
        const roleSelects = Array.from(
            form.querySelectorAll('select[id^="role"]')
        );

        function updateRoleOptions() {
            roleSelects.forEach(select => {
                const selectedByOthers = new Set(
                    roleSelects
                        .filter(other => other !== select)
                        .map(other => other.value)
                        .filter(value => value !== "")
                );

                Array.from(select.options).forEach(option => {
                    option.disabled =
                        option.value !== "" &&
                        selectedByOthers.has(option.value);
                });
            });
        }

        roleSelects.forEach(select => {
            select.addEventListener("change", updateRoleOptions);
        });

        updateRoleOptions();
    }

    // PROSES PENDAFTARAN
    /** @type {(event: SubmitEvent) => Promise<void>} */
    const handleSubmit = async (event) => {
        event.preventDefault();

        const teamName =
            document.getElementById("team-name").value.trim();

        const teamClass =
            document.getElementById("team-class").value.trim();

        const players = [];

        for (let i = 1; i <= totalPlayers; i++) {
            players.push({
                name: document.getElementById("player" + i).value.trim(),
                role: document.getElementById("role" + i).value
            });
        }

        // VALIDASI DATA
        if (!teamName || !teamClass ||
            players.some(player => !player.name || !player.role)) {
            showResult("failed", "Seluruh data pendaftaran wajib diisi.");
            return;
        }

        // VALIDASI ROLE ML
        if (isML) {
            const roles = players.map(player => player.role);

            if (new Set(roles).size !== 5) {
                showResult(
                    "failed",
                    "Setiap pemain Mobile Legends wajib memiliki role berbeda."
                );
                return;
            }
        }

        const button = form.querySelector('button[type="submit"]');

        button.disabled = true;
        button.textContent = "MENGIRIM...";

        try {
            const { error } = await db.rpc(
                "register_esports_team",
                {
                    p_game: game,
                    p_team_name: teamName,
                    p_class_name: teamClass,
                    p_players: players
                }
            );

            if (error) throw error;

            showResult("success");

        } catch (error) {
            showResult("failed", error.message);

        } finally {
            button.disabled = false;
        }
    };

    form.addEventListener("submit", handleSubmit);
});
