const dest_input = document.getElementById("dest_input")
const search_btn = document.getElementById("search_btn")
const title = document.getElementById("title")
const temp = document.getElementById("temp")
const desc = document.getElementById("desc")

function loadNewDestination() {
  let destination = dest_input.value
  setDestination(destination.toLowerCase());
}

function setDestination(destination) {
  const url = `/weather?city=${destination}`;
  fetch(url).then((res) => res.json()).then((data) => {
    if (data["cod"] == 404) {
      title.innerText = "Destination non trouvée"
      temp.innerText = `Température: - C°`;
      desc.innerText = `Description: -`;
      return
    }
    title.innerText = `Météo actuelle à ${data['name']} (${data['sys']['country']})`;
    temp.innerText = `Température: ${Math.round((data['main']['temp'] - 273.15) * 100) / 100} C°`;
    desc.innerText = `Description: ${data['weather'][0]['description']}`;
  });
}
search_btn.addEventListener("click", loadNewDestination)
setDestination('moutier')