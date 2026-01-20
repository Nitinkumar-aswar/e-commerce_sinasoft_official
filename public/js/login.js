document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent default form submission

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/admin/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.status) {
      // login success → redirect to slider
      window.location.href = "/admin/slider";
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Try again!");
  }
});
document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent default form submission

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/admin/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.status) {
      // login success → redirect to slider
      window.location.href = "/admin/slider";
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Try again!");
  }
});
