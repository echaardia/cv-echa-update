$(document).ready(function() {
    // Mobile menu toggle
    $("#menuToggle").click(function() {
        $("#mainNav").toggleClass("show");
    });

    // Load page function
    function loadPage(page) {
        $("#loadingSpinner").fadeIn();
        
        $.ajax({
            url: page + ".html",
            method: "GET",
            success: function(data) {
                $("#pageContainer").fadeOut(200, function() {
                    $(this).html(data).fadeIn(400);
                    $("#loadingSpinner").fadeOut();
                    
                    if(page === "contact") initContactForm();
                    if(page === "github") fetchGitHubInfo();
                });
                
                $(".nav-btn").removeClass("active");
                $(`.nav-btn[data-page="${page}"]`).addClass("active");
                $("#mainNav").removeClass("show");
            },
            error: function() {
                $("#pageContainer").html('<div class="card" style="text-align:center; color:red;">❌ Gagal memuat halaman ' + page + '.html. Pastikan file-nya ada!</div>');
                $("#loadingSpinner").fadeOut();
            }
        });
    }
 
    function initContactForm() {
        // KEY untuk menyimpan semua pesan
        const MESSAGES_KEY = "cv_messages_list";
        
        // Fungsi untuk mengambil semua pesan dari localStorage
        function getAllMessages() {
            var messages = localStorage.getItem(MESSAGES_KEY);
            if(messages) {
                return JSON.parse(messages);
            }
            return [];
        }
        
        // Fungsi untuk menyimpan semua pesan ke localStorage
        function saveAllMessages(messages) {
            localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        }
        
        // Fungsi untuk menampilkan semua pesan di halaman
        function displayAllMessages() {
            var messages = getAllMessages();
            var totalPesan = messages.length;
            
            $("#totalPesan").text(totalPesan);
            
            if(totalPesan === 0) {
                $("#pesanKosong").show();
                $("#listPesan").hide().empty();
            } else {
                $("#pesanKosong").hide();
                $("#listPesan").show().empty();
                
                // Urutkan dari yang terbaru (terbalik)
                messages.reverse().forEach(function(msg, index) {
                    var tanggal = new Date(msg.timestamp);
                    var tanggalStr = tanggal.toLocaleDateString('id-ID') + " " + tanggal.toLocaleTimeString('id-ID');
                    
                    var messageHtml = `
                        <div style="background: #f8fafc; border-radius: 16px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid #ec4899;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 8px;">
                                <strong style="color: #db2777;"><i class="fas fa-user"></i> ${escapeHtml(msg.name)}</strong>
                                <small style="color: #999;"><i class="fas fa-clock"></i> ${tanggalStr}</small>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <small style="color: #666;"><i class="fas fa-envelope"></i> ${escapeHtml(msg.email)}</small>
                            </div>
                            <div style="background: white; padding: 0.8rem; border-radius: 12px; margin-top: 8px;">
                                <p style="margin: 0; color: #333; word-wrap: break-word; white-space: pre-wrap;">${escapeHtml(msg.message)}</p>
                            </div>
                        </div>
                    `;
                    $("#listPesan").append(messageHtml);
                });
            }
        }
        
        // Helper untuk menghindari XSS
        function escapeHtml(text) {
            if(!text) return "";
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }
        
        // Load form data (untuk auto-fill form, tapi tidak untuk riwayat)
        // Riwayat pakai MESSAGES_KEY terpisah
        
        // Tampilkan semua pesan yang sudah ada
        displayAllMessages();
        
        // Form submit untuk menambah pesan baru
        $("#contactForm").off("submit").on("submit", function(e) {
            e.preventDefault();
            
            $(".error-msg").remove();
            
            var name = $("#contactName").val().trim();
            var email = $("#contactEmail").val().trim();
            var message = $("#contactMessage").val().trim();
            var isValid = true;
            
            if(name === "") {
                $("#contactName").after('<div class="error-msg">Nama tidak boleh kosong!</div>');
                isValid = false;
            }
            if(email === "") {
                $("#contactEmail").after('<div class="error-msg">Email tidak boleh kosong!</div>');
                isValid = false;
            } else if(!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) {
                $("#contactEmail").after('<div class="error-msg">Format email tidak valid!</div>');
                isValid = false;
            }
            if(message === "") {
                $("#contactMessage").after('<div class="error-msg">Pesan tidak boleh kosong!</div>');
                isValid = false;
            } else if(message.length < 10) {
                $("#contactMessage").after('<div class="error-msg">Pesan minimal 10 karakter! (sekarang ' + message.length + ')</div>');
                isValid = false;
            }
            
            if(isValid) {
                // Ambil pesan yang sudah ada
                var messages = getAllMessages();
                
                // Tambah pesan baru
                var newMessage = {
                    id: Date.now(),
                    name: name,
                    email: email,
                    message: message,
                    timestamp: new Date().toISOString()
                };
                messages.push(newMessage);
                
                // Simpan kembali ke localStorage
                saveAllMessages(messages);
                
                // Update tampilan
                displayAllMessages();
                
                // Reset form
                $("#contactForm")[0].reset();
                
                // Notifikasi sukses
                showToast("✅ Pesan berhasil dikirim & tersimpan!", "success");
            } else {
                showToast("⚠️ Ada kesalahan, periksa kembali!", "error");
            }
        });
        
        // Hapus semua pesan
        $("#clearAllMessages").off("click").on("click", function() {
            if(confirm("Yakin ingin menghapus SEMUA pesan yang tersimpan?")) {
                localStorage.removeItem(MESSAGES_KEY);
                displayAllMessages();
                showToast("🗑️ Semua pesan telah dihapus!", "success");
            }
        });
        
        // Toast notification
        function showToast(message, type) {
            var toast = $(`<div class="toast-notification ${type === "error" ? "error" : ""}">${message}</div>`);
            $("body").append(toast);
            setTimeout(function() {
                toast.fadeOut(300, function() { $(this).remove(); });
            }, 3000);
        }
    }


    
    // GitHub API
    function fetchGitHubInfo() {
        let username = "echaardia";
        $("#githubContainer").html('<div class="loading-spinner"><i class="fas fa-spinner fa-pulse"></i> Mengambil data dari GitHub...</div>');
        
        $.ajax({
            url: "https://api.github.com/users/" + username,
            method: "GET",
            success: function(user) {
                let html = `
                    <div class="github-profile">
                        <img src="${user.avatar_url}" class="github-avatar">
                        <div>
                            <h3>${user.name || user.login}</h3>
                            <p>Followers: ${user.followers} | Following: ${user.following}</p>
                            <p>Public Repos: ${user.public_repos}</p>
                            <p>${user.bio || "Web Developer"}</p>
                            <a href="${user.html_url}" target="_blank">🔗 Lihat Profil GitHub</a>
                        </div>
                    </div>
                `;
                $("#githubContainer").html(html);
            },
            error: function() {
                $("#githubContainer").html('<div class="card" style="color:red;">❌ Gagal mengambil data GitHub</div>');
            }
        });
    }
    
    // Navigation
    $(".nav-btn").click(function() {
        let page = $(this).data("page");
        loadPage(page);
    });
    
    // Load home page
    loadPage("home");
});