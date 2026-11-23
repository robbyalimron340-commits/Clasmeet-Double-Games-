
/**
 * NESEMBA E-SPORTS
 * ADMIN MANAGEMENT SYSTEM
 */

/**
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} game
 * @property {string} team_name
 * @property {string} class_name
 * @property {string} captain_name
 * @property {string} status
 */

/**
 * @typedef {Object} AdminAccount
 * @property {string} user_id
 * @property {string} display_name
 * @property {string} email
 * @property {string} status
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} team_id
 * @property {number} player_number
 * @property {string} player_name
 * @property {string} role
 */

document.addEventListener("DOMContentLoaded", async () => {

    const db = window.NESEMBA_SUPABASE;
    const page = document.body.dataset.adminPage;

    // =====================================
    // PERIKSA KONEKSI SUPABASE
    // =====================================

    if (!db) {
        console.error("NESEMBA_SUPABASE tidak ditemukan.");

        const message =
            document.getElementById("login-message");

        if (message) {
            message.textContent = "Supabase belum terhubung.";
        }

        return;
    }

    // =====================================
    // FUNGSI PEMERIKSAAN PROFIL
    // =====================================

    async function getAdminProfile() {

        const { data: sessionData, error: sessionError } =
            await db.auth.getSession();

        if (sessionError || !sessionData.session) {
            return null;
        }

        const user = sessionData.session.user;

        const { data: profile, error: profileError } =
            await db
                .from("admin_profiles")
                .select("display_name, role")
                .eq("user_id", user.id)
                .single();

        if (profileError || !profile) {
            console.error("PROFILE ERROR:", profileError);
            return null;
        }

        if (
            profile.role !== "admin" &&
            profile.role !== "super_admin"
        ) {
            return null;
        }

        return { user, profile };
    }

    // =====================================
    // LOGIN ADMIN
    // =====================================

    const loginForm =
        document.getElementById("admin-login-form");

    const loginMessage =
        document.getElementById("login-message");

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const emailInput =
                document.getElementById("admin-email");

            const passwordInput =
                document.getElementById("admin-password");

            if (!emailInput || !passwordInput) return;

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (loginMessage) {
                loginMessage.textContent = "Memproses login...";
            }

            try {

                const { data, error } =
                    await db.auth.signInWithPassword({
                        email,
                        password
                    });

                if (error) {
                    loginMessage.textContent =
                        "Login gagal: " + error.message;
                    return;
                }

                const { data: profile, error: profileError } =
                    await db
                        .from("admin_profiles")
                        .select("display_name, role")
                        .eq("user_id", data.user.id)
                        .single();

                console.log("LOGIN USER:", data.user);
                console.log("PROFILE:", profile);
                console.log("PROFILE ERROR:", profileError);

                if (profileError || !profile) {

                    await db.auth.signOut();

                    loginMessage.textContent = profileError
                        ? "Kesalahan database: " + profileError.message
                        : "Profil Admin tidak ditemukan.";

                    return;
                }

                if (
                    profile.role !== "admin" &&
                    profile.role !== "super_admin"
                ) {

                    await db.auth.signOut();

                    loginMessage.textContent =
                        "Akun tidak memiliki akses Admin.";

                    return;
                }

                window.location.href = "dashboard.html";

            } catch (error) {

                console.error("LOGIN ERROR:", error);

                if (loginMessage) {
                    loginMessage.textContent =
                        "Terjadi kesalahan: " + error.message;
                }
            }
        });
    }

    // =====================================
    // EDGE FUNCTION MANAJEMEN ADMIN
    // =====================================

    /**
     * @param {Record<string, unknown>} payload
     */
    

async function manageAdmin(payload) {
    const { data, error } =
        await db.functions.invoke("smooth-service", {
            body: payload
        });

    if (error) {
        let detail = error.message;

        try {
            const response = error.context?.clone
                ? error.context.clone()
                : error.context;

            if (response) {
                const result = await response.json();

                detail = [
                    result.error,
                    result.detail,
                    result.code ? "Kode: " + result.code : ""
                ].filter(Boolean).join(" | ");
            }
        } catch (e) {
            console.error("DETAIL ERROR:", e);
        }

        console.error("EDGE FUNCTION ERROR:", error);
        throw new Error(detail);
    }

    if (data?.error) {
        throw new Error(data.error);
    }

    return data;
}



    // =====================================
    // HALAMAN MANAJEMEN ADMIN
    // =====================================

    if (page === "admins") {

        const auth = await getAdminProfile();

        if (!auth) {
            window.location.href = "login.html";
            return;
        }

        if (auth.profile.role !== "super_admin") {

            alert("Akses ditolak. Khusus Super Admin.");

            window.location.href = "dashboard.html";
            return;
        }

        const adminList =
            document.getElementById("admin-list");

        const adminForm =
            document.getElementById("create-admin-form");

        const adminMessage =
            document.getElementById("admin-message");

        // =====================================
        // MUAT DAFTAR ADMIN
        // =====================================

        async function loadAdmins() {

            if (!adminList) return;

            adminList.innerHTML = `
                <tr>
                    <td colspan="4">Memuat daftar Admin...</td>
                </tr>
            `;

            try {

                const data = await manageAdmin({
                    action: "list"
                });

                /** @type {AdminAccount[]} */
                const adminAccounts = data.admins || [];

                adminList.innerHTML = "";

                if (adminAccounts.length === 0) {

                    adminList.innerHTML = `
                        <tr>
                            <td colspan="4">Belum ada akun Admin.</td>
                        </tr>
                    `;

                    return;
                }

                adminAccounts.forEach((admin) => {

                    const row = document.createElement("tr");

                    const nameCell = document.createElement("td");
                    nameCell.textContent =
                        admin.display_name || "-";

                    const emailCell = document.createElement("td");
                    emailCell.textContent =
                        admin.email || "-";

                    const statusCell = document.createElement("td");
                    statusCell.textContent =
                        admin.status || "-";

                    const actionCell = document.createElement("td");

                    const actions = document.createElement("div");
                    actions.className = "admin-actions";

                    // EDIT ADMIN
                    const editButton =
                        document.createElement("button");

                    editButton.className = "admin-button";
                    editButton.textContent = "EDIT";

                    editButton.addEventListener("click", async () => {

                        const newName = prompt(
                            "Nama Admin:",
                            admin.display_name || ""
                        );

                        if (newName === null) return;

                        const newEmail = prompt(
                            "Email Admin:",
                            admin.email || ""
                        );

                        if (newEmail === null) return;

                        if (!newName.trim() || !newEmail.trim()) {
                            alert("Nama dan email wajib diisi.");
                            return;
                        }

                        try {

                            const result = await manageAdmin({
                                action: "update",
                                user_id: admin.user_id,
                                display_name: newName.trim(),
                                email: newEmail.trim()
                            });

                            alert(
                                result.message ||
                                "Admin berhasil diperbarui."
                            );

                            await loadAdmins();

                        } catch (error) {

                            alert(
                                "Gagal mengedit Admin: " +
                                error.message
                            );
                        }
                    });

                    actions.appendChild(editButton);

                    // AKTIFKAN / NONAKTIFKAN ADMIN
                    const statusButton =
                        document.createElement("button");

                    statusButton.className = "admin-button";

                    const isActive = admin.status === "aktif";

                    statusButton.textContent = isActive
                        ? "NONAKTIFKAN"
                        : "AKTIFKAN";

                    statusButton.addEventListener("click", async () => {

                        const action = isActive
                            ? "deactivate"
                            : "activate";

                        const confirmed = confirm(
                            isActive
                                ? "Nonaktifkan akun Admin ini?"
                                : "Aktifkan kembali akun Admin ini?"
                        );

                        if (!confirmed) return;

                        try {

                            const result = await manageAdmin({
                                action,
                                user_id: admin.user_id
                            });

                            alert(
                                result.message ||
                                "Status berhasil diubah."
                            );

                            await loadAdmins();

                        } catch (error) {

                            alert(
                                "Gagal mengubah status: " +
                                error.message
                            );
                        }
                    });

                    actions.appendChild(statusButton);

                    // HAPUS ADMIN
                    const deleteButton =
                        document.createElement("button");

                    deleteButton.className = "admin-button";
                    deleteButton.textContent = "HAPUS";
                    deleteButton.style.background = "#dc2626";

                    deleteButton.addEventListener("click", async () => {

                        const confirmed = confirm(
                            "Yakin ingin menghapus akun Admin ini secara permanen?"
                        );

                        if (!confirmed) return;

                        try {

                            const result = await manageAdmin({
                                action: "delete",
                                user_id: admin.user_id
                            });

                            alert(
                                result.message ||
                                "Admin berhasil dihapus."
                            );

                            await loadAdmins();

                        } catch (error) {

                            alert(
                                "Gagal menghapus Admin: " +
                                error.message
                            );
                        }
                    });

                    actions.appendChild(deleteButton);

                    actionCell.appendChild(actions);

                    row.appendChild(nameCell);
                    row.appendChild(emailCell);
                    row.appendChild(statusCell);
                    row.appendChild(actionCell);

                    adminList.appendChild(row);
                });

            } catch (error) {

                console.error("ADMIN LIST ERROR:", error);

                adminList.innerHTML = "";

                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 4;
                cell.textContent =
                    "Gagal memuat Admin: " + error.message;

                row.appendChild(cell);
                adminList.appendChild(row);
            }
        }

        // =====================================
        // TAMBAH ADMIN
        // =====================================

        if (adminForm) {

            adminForm.addEventListener("submit", async (event) => {

                event.preventDefault();

                const nameInput =
                    document.getElementById("new-admin-name");

                const emailInput =
                    document.getElementById("new-admin-email");

                const passwordInput =
                    document.getElementById("new-admin-password");

                if (!nameInput || !emailInput || !passwordInput) {
                    return;
                }

                const displayName = nameInput.value.trim();
                const email = emailInput.value.trim();
                const password = passwordInput.value;

                if (!displayName || !email || !password) {

                    adminMessage.textContent =
                        "Semua kolom wajib diisi.";

                    return;
                }

                if (password.length < 6) {

                    adminMessage.textContent =
                        "Password minimal 6 karakter.";

                    return;
                }

                adminMessage.textContent =
                    "Sedang membuat akun Admin...";

                try {

                    const result = await manageAdmin({
                        action: "create",
                        display_name: displayName,
                        email,
                        password
                    });

                    adminMessage.textContent =
                        result.message || "Admin berhasil dibuat.";

                    adminForm.reset();

                    await loadAdmins();

                } catch (error) {

                    adminMessage.textContent =
                        "Gagal membuat Admin: " + error.message;
                }
            });
        }

        await loadAdmins();
    }

    // =====================================
    // HALAMAN DASHBOARD
    // =====================================

    if (page === "dashboard") {

        const auth = await getAdminProfile();

        if (!auth) {
            window.location.href = "login.html";
            return;
        }

        const profile = auth.profile;

        // INFORMASI ADMIN
        const adminName =
            document.getElementById("admin-name");

        if (adminName) {
            adminName.textContent =
                profile.display_name || "Administrator";
        }

        console.log("Admin:", profile.display_name);
        console.log("Role:", profile.role);

        const isSuperAdmin =
            profile.role === "super_admin";

        // MENU SUPER ADMIN
        const adminManagementMenu =
            document.getElementById("admin-management-menu");

        if (adminManagementMenu) {
            adminManagementMenu.style.display =
                isSuperAdmin ? "" : "none";
        }

        // TOMBOL KELOLA ADMIN
        const manageAdminsButton =
            document.getElementById("manage-admins");

        if (manageAdminsButton && isSuperAdmin) {

            manageAdminsButton.addEventListener("click", () => {
                window.location.href = "admins.html";
            });
        }

        // =====================================
        // MUAT DATA PESERTA DASHBOARD
        // =====================================

        async function loadParticipants() {

            const table =
                document.getElementById("participants-table");

            if (!table) {
                console.error("participants-table tidak ditemukan.");
                return;
            }

            table.innerHTML = `
                <tr>
                    <td colspan="6">Memuat data peserta...</td>
                </tr>
            `;

            const { data: teams, error } =
                await db
                    .from("teams")
                    .select(
                        "id, game, team_name, class_name, captain_name, status"
                    )
                    .order("created_at", { ascending: false });

            if (error) {

                console.error("GAGAL MENGAMBIL DATA:", error);

                table.innerHTML = "";

                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 6;
                cell.textContent =
                    "Gagal memuat data: " + error.message;

                row.appendChild(cell);
                table.appendChild(row);

                return;
            }

            /** @type {Team[]} */
            const teamList = teams || [];

            // STATISTIK
            const totalParticipants =
                document.getElementById("total-participants");

            const totalML =
                document.getElementById("total-ml");

            const totalFF =
                document.getElementById("total-ff");

            if (totalParticipants) {
                totalParticipants.textContent =
                    String(teamList.length);
            }

            if (totalML) {
                totalML.textContent = String(
                    teamList.filter(
                        team => team.game === "Mobile Legends"
                    ).length
                );
            }

            if (totalFF) {
                totalFF.textContent = String(
                    teamList.filter(
                        team => team.game === "Free Fire"
                    ).length
                );
            }

            table.innerHTML = "";

            if (teamList.length === 0) {

                table.innerHTML = `
                    <tr>
                        <td colspan="6">
                            Belum ada peserta terdaftar.
                        </td>
                    </tr>
                `;

                return;
            }

            teamList.forEach((team) => {

                const row = document.createElement("tr");

                [
                    team.team_name,
                    team.game,
                    team.class_name,
                    team.captain_name,
                    team.status
                ].forEach((value) => {

                    const cell = document.createElement("td");
                    cell.textContent = value || "-";

                    row.appendChild(cell);
                });

                const actionCell =
                    document.createElement("td");

                // EDIT TIM
                const editButton =
                    document.createElement("button");

                editButton.textContent = "EDIT";
                editButton.className = "admin-button";

                editButton.addEventListener("click", async () => {

                    const teamName = prompt(
                        "Nama tim:",
                        team.team_name
                    );

                    if (teamName === null) return;

                    const className = prompt(
                        "Kelas:",
                        team.class_name
                    );

                    if (className === null) return;

                    const captainName = prompt(
                        "Nama kapten:",
                        team.captain_name
                    );

                    if (captainName === null) return;

                    if (
                        !teamName.trim() ||
                        !className.trim() ||
                        !captainName.trim()
                    ) {
                        alert("Data tidak boleh kosong.");
                        return;
                    }

                    const { error } = await db
                        .from("teams")
                        .update({
                            team_name: teamName.trim(),
                            class_name: className.trim(),
                            captain_name: captainName.trim()
                        })
                        .eq("id", team.id);

                    if (error) {
                        alert("Gagal mengedit: " + error.message);
                    } else {
                        alert("Data tim berhasil diperbarui.");
                        await loadParticipants();
                    }
                });

                // HAPUS TIM
                const deleteButton =
                    document.createElement("button");

                deleteButton.textContent = "HAPUS";
                deleteButton.className = "admin-button";
                deleteButton.style.background = "#dc2626";

                deleteButton.addEventListener("click", async () => {

                    const confirmed = confirm(
                        "Yakin ingin menghapus tim " +
                        team.team_name +
                        " beserta seluruh pemainnya?"
                    );

                    if (!confirmed) return;

                    const { error: playerError } =
                        await db
                            .from("team_players")
                            .delete()
                            .eq("team_id", team.id);

                    if (playerError) {
                        alert(
                            "Gagal menghapus pemain: " +
                            playerError.message
                        );
                        return;
                    }

                    const { error: teamError } =
                        await db
                            .from("teams")
                            .delete()
                            .eq("id", team.id);

                    if (teamError) {
                        alert(
                            "Gagal menghapus tim: " +
                            teamError.message
                        );
                    } else {
                        alert("Tim berhasil dihapus.");
                        await loadParticipants();
                    }
                });

                actionCell.appendChild(editButton);
                actionCell.appendChild(deleteButton);

                row.appendChild(actionCell);
                table.appendChild(row);
            });

            console.log(
                "Data tim berhasil dimuat:",
                teamList.length
            );
        }

        await loadParticipants();

        // KELOLA PESERTA
        const manageParticipantsButton =
            document.getElementById("manage-participants");

        if (manageParticipantsButton) {

            manageParticipantsButton.addEventListener("click", () => {
                window.location.href = "participants.html";
            });
        }

        // LOGOUT DASHBOARD
        const logoutButton =
            document.getElementById("admin-logout");

        if (logoutButton) {

            logoutButton.addEventListener("click", async () => {

                const { error } = await db.auth.signOut();

                if (error) {
                    alert("Gagal logout: " + error.message);
                    return;
                }

                window.location.href = "login.html";
            });
        }
    }

    // =====================================
    // HALAMAN KELOLA PESERTA
    // =====================================

    if (page === "participants") {

        const auth = await getAdminProfile();

        if (!auth) {
            window.location.href = "login.html";
            return;
        }

        const table =
            document.getElementById("participants-table");

        if (!table) {
            console.error("participants-table tidak ditemukan.");
            return;
        }

        const { data: teams, error } =
            await db
                .from("teams")
                .select(
                    "id, game, team_name, class_name, captain_name, status"
                )
                .order("created_at", { ascending: false });

        if (error) {

            table.innerHTML = "";

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 6;
            cell.textContent =
                "Gagal memuat data: " + error.message;

            row.appendChild(cell);
            table.appendChild(row);

            return;
        }

        /** @type {Team[]} */
        const teamList = teams || [];

        // =====================================
        // PENCARIAN DAN FILTER
        // =====================================

        const searchInput =
            document.getElementById("search-participants");

        const gameFilter =
            document.getElementById("filter-game");

        function applyFilters() {

            const keyword = searchInput
                ? searchInput.value.toLowerCase().trim()
                : "";

            const selectedGame = gameFilter
                ? gameFilter.value
                : "";

            const filteredTeams = teamList.filter((team) => {

                const teamName =
                    (team.team_name || "").toLowerCase();

                const captainName =
                    (team.captain_name || "").toLowerCase();

                const matchesSearch =
                    teamName.includes(keyword) ||
                    captainName.includes(keyword);

                const matchesGame =
                    !selectedGame ||
                    selectedGame === "all" ||
                    team.game === selectedGame;

                return matchesSearch && matchesGame;
            });

            renderParticipants(filteredTeams);
        }

        if (searchInput) {
            searchInput.addEventListener("input", applyFilters);
        }

        if (gameFilter) {
            gameFilter.addEventListener("change", applyFilters);
        }

        // =====================================
        // RENDER PESERTA
        // =====================================

        /**
         * @param {Team[]} displayTeams
         */
        function renderParticipants(displayTeams) {

            table.innerHTML = "";

            if (displayTeams.length === 0) {

                table.innerHTML = `
                    <tr>
                        <td colspan="6">
                            Peserta tidak ditemukan.
                        </td>
                    </tr>
                `;

                return;
            }

            displayTeams.forEach((team) => {

                const row = document.createElement("tr");

                // DATA TIM
                [
                    team.team_name,
                    team.game,
                    team.class_name,
                    team.captain_name
                ].forEach((value) => {

                    const cell = document.createElement("td");
                    cell.textContent = value || "-";

                    row.appendChild(cell);
                });

                // STATUS BERWARNA
                const statusCell =
                    document.createElement("td");

                const statusBadge =
                    document.createElement("span");

                statusBadge.textContent =
                    team.status === "approved"
                        ? "DITERIMA"
                        : team.status === "rejected"
                            ? "DITOLAK"
                            : "PENDING";

                statusBadge.style.padding = "5px 12px";
                statusBadge.style.borderRadius = "20px";
                statusBadge.style.fontWeight = "bold";
                statusBadge.style.fontSize = "12px";

                if (team.status === "approved") {

                    statusBadge.style.background =
                        "rgba(34, 197, 94, 0.15)";

                    statusBadge.style.color = "#22c55e";

                } else if (team.status === "rejected") {

                    statusBadge.style.background =
                        "rgba(239, 68, 68, 0.15)";

                    statusBadge.style.color = "#ef4444";

                } else {

                    statusBadge.style.background =
                        "rgba(234, 179, 8, 0.15)";

                    statusBadge.style.color = "#eab308";
                }

                statusCell.appendChild(statusBadge);
                row.appendChild(statusCell);

                const actionCell =
                    document.createElement("td");

                // =====================================
                // DETAIL TIM
                // =====================================

                const detailButton =
                    document.createElement("button");

                detailButton.textContent = "DETAIL";
                detailButton.className = "admin-button";

                detailButton.style.marginBottom = "6px";

                detailButton.addEventListener("click", async () => {

                    const { data: players, error } =
                        await db
                            .from("team_players")
                            .select(
                                "player_number, player_name, role"
                            )
                            .eq("team_id", team.id)
                            .order("player_number", {
                                ascending: true
                            });

                    if (error) {
                        alert(
                            "Gagal memuat detail: " +
                            error.message
                        );
                        return;
                    }

                    if (!players || players.length === 0) {
                        alert("Belum ada data pemain.");
                        return;
                    }

                    let detail =
                        "DETAIL TIM: " + team.team_name + "\n";

                    detail += "Game: " + team.game + "\n";
                    detail += "Kelas: " + team.class_name + "\n";
                    detail += "Kapten: " + team.captain_name + "\n\n";
                    detail += "DAFTAR PEMAIN:\n";

                    /** @type {{player_number: number, player_name: string, role: string}[]} */
const playerList = players || [];

playerList.forEach((player) => {

    detail +=
        "\nPemain " + player.player_number;

    detail +=
        "\nNama: " + player.player_name;

    detail +=
        "\nRole: " + player.role + "\n";
});

                    alert(detail);
                });

                actionCell.appendChild(detailButton);

                // =====================================
                // EDIT PEMAIN
                // =====================================

                const editPlayerButton =
                    document.createElement("button");

                editPlayerButton.textContent = "EDIT PEMAIN";
                editPlayerButton.className = "admin-button";

                editPlayerButton.style.marginBottom = "6px";

                editPlayerButton.addEventListener("click", async () => {

                    const { data: players, error } =
                        await db
                            .from("team_players")
                            .select(
                                "id, team_id, player_number, player_name, role"
                            )
                            .eq("team_id", team.id)
                            .order("player_number", {
                                ascending: true
                            });

                    if (error) {
                        alert(
                            "Gagal mengambil pemain: " +
                            error.message
                        );
                        return;
                    }

                    /** @type {Player[]} */
                    const playerList = players || [];

                    if (playerList.length === 0) {
                        alert("Tidak ada data pemain.");
                        return;
                    }

                    let playerInfo = "DAFTAR PEMAIN:\n";

                    playerList.forEach((player) => {

                        playerInfo +=
                            "\n" + player.player_number + ". ";

                        playerInfo +=
                            player.player_name +
                            " (" + player.role + ")";
                    });

                    const numberInput = prompt(
                        playerInfo +
                        "\n\nMasukkan nomor pemain yang ingin diedit:"
                    );

                    if (numberInput === null) return;

                    const playerNumber = Number(numberInput);

                    const selectedPlayer = playerList.find(
                        player =>
                            player.player_number === playerNumber
                    );

                    if (!selectedPlayer) {
                        alert("Nomor pemain tidak ditemukan.");
                        return;
                    }

                    const newName = prompt(
                        "Nama pemain:",
                        selectedPlayer.player_name
                    );

                    if (newName === null) return;

                    if (!newName.trim()) {
                        alert("Nama pemain tidak boleh kosong.");
                        return;
                    }

                    let allowedRoles = [];

                    if (team.game === "Mobile Legends") {

                        allowedRoles = [
                            "Mid Laner",
                            "Exp Laner",
                            "Gold Laner",
                            "Jungler",
                            "Roamer"
                        ];

                    } else if (team.game === "Free Fire") {

                        allowedRoles = [
                            "Support",
                            "Rifler",
                            "Sniper",
                            "Rusher",
                            "Bomber"
                        ];

                    } else {

                        alert("Jenis game tidak dikenali.");
                        return;
                    }

                    const newRole = prompt(
                        "Pilih role:\n" +
                        allowedRoles.join("\n"),
                        selectedPlayer.role
                    );

                    if (newRole === null) return;

                    const trimmedRole = newRole.trim();

                    if (!allowedRoles.includes(trimmedRole)) {
                        alert("Role tidak valid.");
                        return;
                    }

                    // ROLE MOBILE LEGENDS HARUS UNIK
                    if (team.game === "Mobile Legends") {

                        const duplicateRole = playerList.some(
                            player =>
                                player.player_number !== playerNumber &&
                                player.role === trimmedRole
                        );

                        if (duplicateRole) {
                            alert(
                                "Role tersebut sudah digunakan pemain lain."
                            );
                            return;
                        }
                    }

                    const { error: updateError } =
                        await db
                            .from("team_players")
                            .update({
                                player_name: newName.trim(),
                                role: trimmedRole
                            })
                            .eq("id", selectedPlayer.id);

                    if (updateError) {

                        alert(
                            "Gagal mengedit pemain: " +
                            updateError.message
                        );

                    } else {

                        alert("Data pemain berhasil diperbarui.");
                        window.location.reload();
                    }
                });

                actionCell.appendChild(editPlayerButton);

                // =====================================
                // EDIT TIM
                // =====================================

                const editButton =
                    document.createElement("button");

                editButton.textContent = "EDIT";
                editButton.className = "admin-button";

                editButton.addEventListener("click", async () => {

                    const teamName = prompt(
                        "Nama tim:",
                        team.team_name
                    );

                    if (teamName === null) return;

                    const className = prompt(
                        "Kelas:",
                        team.class_name
                    );

                    if (className === null) return;

                    const captainName = prompt(
                        "Nama kapten:",
                        team.captain_name
                    );

                    if (captainName === null) return;

                    if (
                        !teamName.trim() ||
                        !className.trim() ||
                        !captainName.trim()
                    ) {
                        alert("Data tidak boleh kosong.");
                        return;
                    }

                    const { error } = await db
                        .from("teams")
                        .update({
                            team_name: teamName.trim(),
                            class_name: className.trim(),
                            captain_name: captainName.trim()
                        })
                        .eq("id", team.id);

                    if (error) {

                        alert(
                            "Gagal mengedit: " + error.message
                        );

                    } else {

                        alert("Data berhasil diperbarui.");
                        window.location.reload();
                    }
                });

                actionCell.appendChild(editButton);

                // =====================================
                // UBAH STATUS
                // =====================================

                const statusButton =
                    document.createElement("button");

                statusButton.textContent = "UBAH STATUS";
                statusButton.className = "admin-button";

                statusButton.addEventListener("click", async () => {

                    const pilihan = prompt(
                        "Pilih status:\n" +
                        "1. Pending\n" +
                        "2. Diterima\n" +
                        "3. Ditolak",
                        "1"
                    );

                    if (pilihan === null) return;

                    const daftarStatus = {
                        "1": "pending",
                        "2": "approved",
                        "3": "rejected"
                    };

                    const statusBaru =
                        daftarStatus[pilihan.trim()];

                    if (!statusBaru) {
                        alert("Masukkan angka 1, 2, atau 3.");
                        return;
                    }

                    const { error } = await db
                        .from("teams")
                        .update({
                            status: statusBaru
                        })
                        .eq("id", team.id);

                    if (error) {

                        alert(
                            "Gagal mengubah status: " +
                            error.message
                        );

                        return;
                    }

                    alert("Status berhasil diubah!");
                    window.location.reload();
                });

                actionCell.appendChild(statusButton);

                // =====================================
                // HAPUS TIM
                // =====================================

                const deleteButton =
                    document.createElement("button");

                deleteButton.textContent = "HAPUS";
                deleteButton.className = "admin-button";

                deleteButton.style.background = "#dc2626";
                deleteButton.style.marginTop = "6px";

                deleteButton.addEventListener("click", async () => {

                    const confirmed = confirm(
                        "Hapus tim " +
                        team.team_name +
                        " beserta pemainnya?"
                    );

                    if (!confirmed) return;

                    const { error: playerError } =
                        await db
                            .from("team_players")
                            .delete()
                            .eq("team_id", team.id);

                    if (playerError) {

                        alert(
                            "Gagal menghapus pemain: " +
                            playerError.message
                        );

                        return;
                    }

                    const { error: teamError } =
                        await db
                            .from("teams")
                            .delete()
                            .eq("id", team.id);

                    if (teamError) {

                        alert(
                            "Gagal menghapus tim: " +
                            teamError.message
                        );

                    } else {

                        alert("Tim berhasil dihapus.");
                        window.location.reload();
                    }
                });

                actionCell.appendChild(deleteButton);

                row.appendChild(actionCell);
                table.appendChild(row);
            });
        }

        renderParticipants(teamList);

        // LOGOUT HALAMAN PESERTA
        const logoutButton =
            document.getElementById("admin-logout");

        if (logoutButton) {

            logoutButton.addEventListener("click", async () => {

                const { error } = await db.auth.signOut();

                if (error) {
                    alert("Gagal logout: " + error.message);
                    return;
                }

                window.location.href = "login.html";
            });
        }
    }

});
