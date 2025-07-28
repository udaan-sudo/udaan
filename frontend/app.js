// make this website only phone-accessible
window.addEventListener("DOMContentLoaded", function () {
  if (window.innerWidth > 768) {
    document.body.innerHTML = `
      <h1 style="text-align:center; margin-top:20vh;">
        This website is only available on mobile devices.
      </h1>
    `;
    document.body.style.backgroundColor = "#f8f8f8";
  }
});

//scrolling
document.addEventListener("DOMContentLoaded", () => {
    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            // Use requestAnimationFrame to wait for layout
            requestAnimationFrame(() => {
                setTimeout(() => {
                    section.scrollIntoView({ behavior: "smooth" });
                }, 100); // Adjust timeout if still glitchy
            });
        }
    };

    document.getElementById("home-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToSection("home-section");
    });

    document.getElementById("about-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToSection("about-section")
    });

    document.getElementById("events-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToSection("contact-section");
    });
});


//share button
const shareBtn = document.getElementById('share-btn');
  const sharePopup = document.getElementById('share-popup');

  shareBtn.addEventListener('click', () => {
    // Copy link to clipboard (optional)
    navigator.clipboard.writeText("https://udaan-io.netlify.app/");

    // Show popup
    sharePopup.classList.add('show');

    // Hide after 2 seconds
    setTimeout(() => {
      sharePopup.classList.remove('show');
    }, 2000);
  });



// vid script
const video = document.getElementById("slow");
    video.playbackRate = 0.8;       // 1 = normal, 1.5 = 1.5x speed
    

    // Freshers open/close
const openModalBtn = document.getElementById('openModal');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModal');
const para = document.getElementById('para');
openModalBtn.style.display="none";  // hid
openModalBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
});

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

// Close on outside click
modal.addEventListener('click', (e) => {
    if (!modalContent.contains(e.target)) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    }
});

document.getElementById("openModal").addEventListener("click", function () {
    document.getElementById("modal").style.display = "flex";
    document.body.style.overflow = "hidden";
});

document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("modal").style.display = "none";
    document.body.style.overflow = "auto";
});

window.addEventListener("click", function (e) {
    const modal = document.getElementById("modal");
    if (e.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
});

  


// concierto form
   document.getElementById("payBtn").addEventListener("click", async function () {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    // Validation patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\d{10}$/;

    // Validate name
    if (!name || name.replace(/\s+/g, '').length < 3) {
        alert("Name must be at least 3 letters (excluding spaces).");
        return;
    }

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!phonePattern.test(phone)) {
        alert("Phone number must be exactly 10 digits.");
        return;
    }

    try {
        const response = await fetch("/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, phone }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(`${data.message}\nYour Ticket ID: ${data.ticket_id}`);
            document.getElementById("modal").style.display = "none";
            document.body.style.overflow = "auto";
            
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Something went wrong. Please try again.");
    }
});




// devzone open/close
let qrScanner;
let loggedIn = 0;

const devModal = document.getElementById('dev-modal');
const devModalContent = document.getElementById('dev-modalContent');
const qrSection = document.getElementById('qr-section');
const devOpenBtn = document.getElementById('devzone');
const devCloseBtn = document.getElementById('dev-closeModal');
const qrCloseBtn = document.getElementById('qr-close-btn');

// Open modal on devzone click
devOpenBtn.addEventListener("click", () => {
    devModal.style.display = 'flex';
    document.body.classList.add('dev-modal-open');

    if (loggedIn === 1) {
        
        devModalContent.style.display = "none";
        qrSection.style.display = "block";
        
        startQrScanner();
    } else {
        devModalContent.style.display = "block";
        qrSection.style.display = "none";
    }
});

// Close dev modal
devCloseBtn.addEventListener('click', closeDevModal);

// Close QR section only (when QR close button is clicked)
qrCloseBtn.addEventListener('click', closeQrSection);

// Outside click closes modals
devModal.addEventListener('click', (e) => {
    // If clicked outside both dev content and qr-section
    if (!devModalContent.contains(e.target) && !qrSection.contains(e.target)) {
        closeDevModal();
    }
});

function closeDevModal() {
    devModal.style.display = 'none';
    document.body.classList.remove('dev-modal-open');

    // Reset sections
    devModalContent.style.display = "block";
    qrSection.style.display = "none";

    stopQrScanner();
}

function closeQrSection() {
    qrSection.style.display = "none";
    devModal.style.display = 'none';
    document.body.classList.remove('dev-modal-open');

    devModalContent.style.display = "block";
    stopQrScanner();
}

function stopQrScanner() {
    if (qrScanner) {
        qrScanner.stop().then(() => {
            qrScanner.clear();
            document.getElementById("reader").innerHTML = "";
        }).catch((err) => {
            console.error("Error stopping QR scanner:", err);
        });
    }
}

function startQrScanner() {
    document.getElementById("scan-status").innerText = "";
    document.getElementById("reader").innerHTML = "";
    qrScanner = new Html5Qrcode("reader");

    qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
        console.log(`Scanned: ${decodedText}`);
            fetch("/verify-ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticket_id: decodedText })
            })
            .then(res => res.json())
            .then(data => {
                document.getElementById("scan-status").innerText = data.message;
        })
        .catch(err => {
            document.getElementById("scan-status").innerText = "❌ Error verifying ticket.";
            console.error(err);
    });

    qrScanner.stop().then(() => qrScanner.clear());
},

        (errorMessage) => {
            // Optional error logs
        }
    ).catch((err) => {
        console.error(`Unable to start scanning: ${err}`);
    });
}

// Login Logic
document.getElementById("enter").addEventListener("click", async function () {
    const name = document.getElementById("dev-name").value.trim();
    const email = document.getElementById("dev-email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passPattern = /^[A-Za-z0-9]{7}$/;

    if (!name || name.replace(/\s+/g, '').length < 3) return alert("Name must be at least 3 letters (excluding spaces).");
    if (!emailPattern.test(email)) return alert("Please enter a valid email address.");
    if (!passPattern.test(pass)) return alert("Password has wrong format");

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, pass }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(`${data.message}\nLog-In Successful`);
            loggedIn = 1;
            devModalContent.style.display = "none";
            qrSection.style.display = "block";
            para.style.display ="none";
            openModalBtn.style.display = "block";
            startQrScanner();
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Something went wrong. Please try again.");
    }
});
