const shields = require('@coatofbits/data/shields.json').shields
const colours = require('@coatofbits/data/colours.json').colours
const divisions = require('@coatofbits/data/divisions.json').divisions
const backgrounds = require('@coatofbits/data/backgrounds.json').backgrounds
const charges = require('@coatofbits/data/charges.json').charges
const layouts = require('@coatofbits/data/layouts.json').layouts

// generateSvgShield generates an SVG version of the shield given shield information.
// The result is an SVG element with dimensions 500x550
module.exports = {
    generateSvgShield: function(shield) {

        const shieldInfo = shields.find(s => s.id == shield.style.id)

        var svg = `<svg width="500" height="550" viewbox="0 0 500 550" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
        svg += drawSvgShield(shield)
        svg += drawSvgShieldDivisions(shield)

        svg += `<g clip-path="url(#shieldc0)">`
        svg += `<g transform="${shieldInfo.chargetransform}">`
        svg += drawSvgShieldCharge(shield.charge)
        svg += `</g>`
        svg += `</g>`
        svg += `</svg>`
        return svg
    }
}

// Draw an SVG shield
function drawSvgShield(shield) {
    const shieldInfo = shields.find(s => s.id == shield.style.id)

    // Draw the shield itself.
    var svg = `<g stroke="#000000" stroke-width="4px" fill="none">`
    svg += shieldInfo.outline
    svg += `</g>`

    // Set up a clip path to restrict future drawing to inside the shield
    svg += `<clipPath id="shieldc0">`
    svg += shieldInfo.outline
    svg += `</clipPath>`

    // Set up per-division clip paths
    const divisionInfo = divisions.find(d => d.id == shield.divisionStyle.id)
    for (var i = 0; i < divisionInfo.svg.length; i++) {
        svg += `<clipPath id="shieldc${i+1}">`
        svg += divisionInfo.svg[i].element
        svg += `</clipPath>`
    }
    return svg
}

// Draw the divisions of an SVG shield
function drawSvgShieldDivisions(shield) {
    var svg = ''

    const divisionInfo = divisions.find(d => d.id == shield.divisionStyle.id)
    for (var i = 0; i < divisionInfo.svg.length; i++) {
        // Constrain drawing by both the overall shield path and the path of
        // this particular division
        svg += `<g clip-path="url(#shieldc0)">`
        //svg += `<g transform="${shields[info.style.id].basetransform}">`
        svg += `<g clip-path="url(#shieldc${i+1})">`
        svg += drawSvgShieldDivision(shield, i)
        svg += `</g>`
        //svg += `</g>`
        svg += `</g>`
    }

    return svg
}

const shieldWidth = 500
const shieldHeight = 550
const bgWidth = 4400
const bgHeight = 4400
const chargeWidth = 500
const chargeHeight = 500

function drawSvgShieldDivision(shield, divisionId) {
    var svg = ''

    const division = shield.divisions[divisionId]

    // Draw the background.  The background needs to be scaled and centered
    // accordingly depending on the shield and the division styles

    // Flood the background with the primary colour
    svg += `<g stroke="none" fill="${colourRgb(division.background.primaryColour.id)}">`
    svg += divisions.find(d => d.id == shield.divisionStyle.id).svg[divisionId].element
    svg += `</g>`


    // Backgrounds are natively 4400x4400.  Scale and translate accordingly
    // Scaling due to number of divisions
    const shieldInfo = shields.find(s => s.id == shield.style.id)
    const divisionsInfo = shieldInfo.divisions[shield.divisionStyle.id]
    const numDivisions = divisionsInfo.length
    const divisionInfo = divisionsInfo[divisionId]
    // Offsets for this division
    const bgXOffset = (bgWidth / (numDivisions * 2)) - (shieldWidth / 2) + (shieldWidth / 2 - divisionInfo.x)
    const bgYOffset = (bgHeight / (numDivisions * 2)) - (shieldHeight / 2) + (shieldHeight / 2 - divisionInfo.y)

    svg += `<g transform="matrix(${1/numDivisions},0,0,${1/numDivisions},-${bgXOffset},-${bgYOffset})">`
    svg += `<g stroke-width="100px" stroke="${colourRgb(division.background.secondaryColour.id)}" fill="none">`
    svg += backgrounds.find(b => b.id == division.background.style.id).svg
    svg += `</g>`
    svg += `</g>`

    // Charges are natively 500x500.  Scale and translate accordingly
    const chargeScale = divisionInfo.scale || (1 / numDivisions)
    const chargeXOffset = (chargeWidth - chargeWidth * chargeScale) / 2 + divisionInfo.x - chargeWidth / 2
    const chargeYOffset = (chargeHeight - chargeHeight * chargeScale) / 2 + divisionInfo.y - chargeHeight / 2
    svg += `<g transform="matrix(${chargeScale},0,0,${chargeScale},${chargeXOffset},${chargeYOffset})">`
    svg += drawSvgShieldCharge(division.charge)
    svg += `</g>`
    return svg
}

function drawSvgShieldCharge(charge) {
    // Obtain the layout for the charge and stamp it as necessary
    const chargeInfo = charges.find(c => c.id == charge.style.id)
    const layoutInfo = layouts.find(l => l.id == charge.layout.id)

    var svg = `<g stroke-width="2px" stroke="${colourRgb(charge.outlineColour.id)}" fill="${colourRgb(charge.primaryColour.id)}">`
    if (chargeInfo.svg && chargeInfo.svg.length && layoutInfo.transforms && layoutInfo.transforms.length) {
        for (var i = 0; i < layoutInfo.transforms.length; i++) {
            svg += `<g transform="${layoutInfo.transforms[i]}">`
            for (var j = 0; j < chargeInfo.svg.length; j++) {
                svg += chargeInfo.svg[j].element
            }
            svg += `</g>`
        }
    }
    svg += `</g>`

    return svg
}

function colourRgb(id) {
    const colourInfo = colours.find(c => c.id == id)
    return colourInfo.value || 'none'
}

