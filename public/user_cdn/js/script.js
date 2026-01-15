// LED start 
const searchInput = document.getElementById("searchInput");
const products = document.querySelectorAll(".product-item");

searchInput.addEventListener("keyup", function () {
  const searchValue = this.value.toLowerCase();

  products.forEach(product => {
    const productName = product.getAttribute("data-name");

    product.parentElement.style.display =
      productName.includes(searchValue) ? "block" : "none";
  });
});

products.forEach(product => {
  product.addEventListener("click", function () {
    const link = this.getAttribute("data-link");
    if (link) window.location.href = link;
  });
});
// LED end 


// Eletronic start 
  document.querySelectorAll(".arrow-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("View All Clicked");
    });
  });
//   Eletronic end 
