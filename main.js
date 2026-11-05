const modal = document.querySelector(".modal")

let nextUrl = `https://pokeapi.co/api/v2/pokemon?limit=100&offset=0`
const pokemonsDiv = document.getElementById("pokemonsDiv")
const pokemonsMap = new Map()

async function loadAndShow() {
    const pokemons = await loadPokemons()
    savePokemons(pokemons)
    drawPokemons(pokemons)
    await createObserver()
}

async function loadPokemons() {
    const res = await fetch(nextUrl)
    if (!res.ok) throw new Error(res.statusText)
    const pokemonsList = await res.json()
    const pokemons = await Promise.all(pokemonsList.results.map(async ({url}) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
    }))
    nextUrl = pokemonsList.next
    return pokemons
}

function savePokemons(pokemons) {
    pokemons.forEach((p) => pokemonsMap.set(p.id, p))
}

function drawPokemons(pokemons) {
    let fragment = document.createDocumentFragment()
    pokemons.forEach(pokemon => {
        const card = document.createElement("div")
        card.className = "pokemon-card"
        card.id = pokemon.id
        card.innerHTML = `
            <img src="${pokemon.sprites.back_default}" alt="">
            <p>${pokemon.name}</p>
        `
        fragment.append(card)
    });
    pokemonsDiv.append(fragment)
}

async function showPokemonInfo(id) {
    console.log(id)
    const pokemon = pokemonsMap.get(id)
    modal.innerHTML = `
        <p>${pokemon.name} #${pokemon.id}</p>
        <img src="${pokemon.sprites.back_default}" alt="">
        <div class="">
            <p>HP: ♥️ ${pokemon.stats[0].base_stat}</p>
            <p>Attack: ⚔️ ${pokemon.stats[1].base_stat}</p>
            <p>Defense: 🛡️ ${pokemon.stats[2].base_stat}</p>
        </div>
    `
    modal.classList.add("show")
}

let loading = false

async function createObserver() {
    const observer = new IntersectionObserver(async ([entry], obs) => {
        if (!entry.isIntersecting || loading || !nextUrl) return
        loading = true
        try {
            obs.unobserve(entry.target)
            await loadAndShow()
        } catch (e) {
            console.error(`There was an error while trying to get more Pokémon: ${e.message}.`)
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
        finally {
            if (nextUrl) obs.observe(pokemonsDiv.lastElementChild)
            loading = false
        }
    }, {rootMargin: "200px"})
    observer.observe(pokemonsDiv.lastElementChild)
}

pokemonsDiv.addEventListener("click", e => {
    const pokemonCard = e.target.closest(".pokemon-card")
    if (!pokemonCard) return
    showPokemonInfo(Number(pokemonCard.id))
})

loadAndShow()