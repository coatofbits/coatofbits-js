const shields = require('@coatofbits/data/shields.json').shields
const colours = require('@coatofbits/data/colours.json').colours
const divisions = require('@coatofbits/data/divisions.json').divisions
const backgrounds = require('@coatofbits/data/backgrounds.json').backgrounds
const charges = require('@coatofbits/data/charges.json').charges
const layouts = require('@coatofbits/data/layouts.json').layouts

const shieldWidth = 500
const shieldHeight = 550
const bgWidth = 4000
const bgHeight = 4400
const chargeWidth = 500
const chargeHeight = 500

// generateSvgShield generates an SVG version of the shield given shield information.
// The result is an SVG element with dimensions 500x550
module.exports = {
    generateSvgShield: function(shield) {
        const shieldInfo = shields.find(s => s.id == shield.style.id)

        var svg = `<svg width="${shieldWidth}" height="${shieldHeight}" viewbox="0 0 ${shieldWidth} ${shieldHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
        svg += drawSvgShield(shield)
        svg += drawSvgShieldDivisions(shield)

        svg += `<g clip-path="url(#shieldc0)">`
        svg += `<g transform="${shieldInfo.basetransform || ''}">`
        svg += `<g transform="${shieldInfo.chargetransform || ''}">`
        if (shouldApplyTransform(shield.charge.transform)) {
            svg += applyTransform(shield.charge.transform, chargeWidth, chargeHeight)
        }
        svg += drawSvgShieldCharge(shield.charge)
        if (shouldApplyTransform(shield.charge.transform)) {
            svg += `</g>`
        }
        svg += `</g>`
        svg += `</g>`
        svg += `</g>`
        svg += drawGloss()
        svg += `</svg>`
        return svg
    }
}

function drawGloss() {
    var svg = ''

    svg += `<g clip-path="url(#shieldc0)">`
    const xGloss = Math.floor(Math.random()*30)
    const yGloss = Math.floor(Math.random()*20)
    svg += `<radialGradient id="shieldgloss1" cx="${xGloss}%" cy="${yGloss}%" r="50%" fx="${xGloss+10}%" fy="${yGloss+10}%">`
    svg += `<stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>`
    svg += `<stop offset="40%" stop-color="#ffffff" stop-opacity="0.20"/>`
    svg += `<stop offset="60%" stop-color="#ffffff" stop-opacity="0.00"/>`
    svg += `</radialGradient>`
    svg += `<rect x="0" y="0" width="${shieldWidth}" height="${shieldHeight}" fill="url(#shieldgloss1)"/>`
    svg += `<linearGradient id="shieldgloss2" x1="0%" y1="50%" x2="100%" y2="50%">`
    svg += `<stop offset="0%" stop-color="#ffffff" stop-opacity="0.00"/>`
    svg += `<stop offset="50%" stop-color="#ffffff" stop-opacity="0.10"/>`
    svg += `<stop offset="60%" stop-color="#ffffff" stop-opacity="0.00"/>`
    svg += `<stop offset="100%" stop-color="#000000" stop-opacity="0.10"/>`
    svg += `</linearGradient>`
    svg += `<rect x="0" y="0" width="${shieldWidth}" height="${shieldHeight}" fill="url(#shieldgloss2)"/>`
    svg += `</g>`

    return svg
}

// Draw an SVG shield
function drawSvgShield(shield) {
    const shieldInfo = shields.find(s => s.id == shield.style.id)

    // Draw the shield itself.
    var svg = `<g stroke="#000000" stroke-width="4px" fill="#ffffff">`
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
    const shieldInfo = shields.find(s => s.id == shield.style.id)
    for (var i = 0; i < divisionInfo.svg.length; i++) {
        // Constrain drawing by both the overall shield path and the path of
        // this particular division
        svg += `<g clip-path="url(#shieldc0)">`
        svg += `<g clip-path="url(#shieldc${i+1})">`
        svg += drawSvgShieldDivision(shield, i)
        svg += `</g>`
        svg += `</g>`
    }

    return svg
}

function drawSvgShieldDivision(shield, divisionId) {
    var svg = ''

    const shieldInfo = shields.find(s => s.id == shield.style.id)
    const division = shield.divisions[divisionId]
    const divisionsInfo = divisions.find(d => d.id == shield.divisionStyle.id)
    const backgroundInfo = backgrounds.find(b => b.id == division.background.style.id)

    // Draw the background.  The background needs to be scaled and centered
    // accordingly depending on the shield and the division styles

    // Paint the background with the primary colour
    svg += `<g stroke="none" fill="${colourRgb(division.background.primaryColour.id)}">`
    svg += divisionsInfo.svg[divisionId].element
    svg += `</g>`

    // Backgrounds are natively 4000x4400.  Scale and translate accordingly
    const numDivisions = divisionsInfo.segments.length
    const divisionInfo = divisionsInfo.segments[divisionId]
    const bgXOffset = ((bgWidth / (numDivisions * 2)) - divisionInfo.x) * -1
    const bgYOffset = ((bgHeight / (numDivisions * 2)) - divisionInfo.y) * -1

    // Charges are natively 500x500.  Scale and translate accordingly
    const chargeScale = divisionInfo.scale || (1 / numDivisions)
    const chargeXOffset = (chargeWidth - chargeWidth * chargeScale) / 2 + divisionInfo.x - chargeWidth / 2
    const chargeYOffset = (chargeHeight - chargeHeight * chargeScale) / 2 + divisionInfo.y - chargeHeight / 2

    // Background then charge
    svg += `<g transform="${shieldInfo.basetransform || ''}">`
    if (backgroundInfo && backgroundInfo.svg) {
        svg += `<g transform="matrix(${xx(1/numDivisions)},0,0,${xx(1/numDivisions)},${xx(bgXOffset)},${xx(bgYOffset)})">`
        svg += `<g stroke-width="100px" stroke="${colourRgb(division.background.secondaryColour.id)}" fill="none">`
        svg += backgroundInfo.svg
        svg += `</g>`
        svg += `</g>`
    }
    svg += `<g transform="matrix(${xx(chargeScale)},0,0,${xx(chargeScale)},${xx(chargeXOffset)},${xx(chargeYOffset)})">`
    if (shouldApplyTransform(division.charge.transform)) {
        svg += applyTransform(division.charge.transform, chargeWidth, chargeHeight)
    }
    svg += drawSvgShieldCharge(division.charge)
    if (shouldApplyTransform(division.charge.transform)) {
      svg += `</g>`
    }
    svg += `</g>`
    svg += `</g>`

    return svg
}

function xx(val) {
    return Number(Number(val).toFixed(2))
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
                switch (chargeInfo.svg[j].fill) {
                    case 'outline':
                        svg += chargeInfo.svg[j].element.replace('/>', ` fill="${colourRgb(charge.outlineColour.id)}"/>`)
                        break
                    case 'primary':
                        svg += chargeInfo.svg[j].element.replace('/>', ` fill="${colourRgb(charge.primaryColour.id)}"/>`)
                        break
                    case 'secondary':
                        svg += chargeInfo.svg[j].element.replace('/>', ` fill="${colourRgb(charge.secondaryColour.id)}"/>`)
                        break
                    default:
                        svg += chargeInfo.svg[j].element
                        break
                }
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

function shouldApplyTransform(transform) {
    return (transform.scale != 1 || transform.translationX || transform.translationY || transform.rotation)
}

function applyTransform(transform, width, height) {
    svg = `<g transform="`
    if (transform.translationX != 0 || transform.translationY != 0) {
        svg += `translate(${xx(transform.translationX)},${xx(transform.translationY)}) `
    }
    if (transform.scale != 1) {
        svg += `translate(${xx(width/2)},${xx(height/2)}) scale(${xx(transform.scale)}) translate(${xx(-width/2)},${xx(-height/2)}) `
    }
    if (transform.rotation != 0) {
        svg += `rotate(${xx(transform.rotation)},${xx(width/2)},${xx(height/2)}) `
    }
    svg += `">`
    return svg
}
