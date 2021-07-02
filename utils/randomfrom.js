function randomfrom(array)
{
    let selected = Math.floor(Math.random() * array.length)
    return array[selected]
}

module.exports = randomfrom