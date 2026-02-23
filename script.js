const dest_input = document.getElementById("dest_input")
const search_btn = document.getElementById("search_btn")
const title = document.getElementById("title")
const temp = document.getElementById("temp")
const desc = document.getElementById("desc")
const list = document.getElementById("historic-list")

function loadNewDestination() {
  let destination = dest_input.value
  setDestination(destination.toLowerCase());
}

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function setDestination(destination) {
  const url = `/weather?city=${destination}`;
  fetch(url).then((res) => res.json()).then((data) => {
    list.innerHTML = ""
    if (data["cod"] == 404) {
      title.innerText = "Destination non trouvée"
      temp.innerText = `Température: - C°`;
      desc.innerText = `Description: -`;
      return
    }
    title.innerText = `Météo actuelle à ${capitalizeFirstLetter(data.current.city)}`;
    temp.innerText = `Température: ${Math.round(data.current.temp * 100) / 100} C°`;
    desc.innerText = `Description: ${data.current.desc}`;

    for (const row of data.history) {
      const li = document.createElement('li')

      li.innerHTML = `${row.city} - Tempéature: ${row.temperature} - Description: ${row.description} - Timestamp: ${row.timestamp}`

      list.appendChild(li)
    }
  });
}
search_btn.addEventListener("click", loadNewDestination)
setDestination('moutier')