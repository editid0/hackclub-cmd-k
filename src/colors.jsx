import { Action, ActionPanel, Detail, Form, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";
import { useState } from "react";

function detectFormat(colour) {
    if (/^(?:#?)(([a-fA-F0-9]{3})|([a-fA-F0-9]{6}))$/.test(colour)) {
        return "hex";
    }
    if (/^(?:#?)(([a-fA-F0-9]{4})|([a-fA-F0-9]{8}))$/.test(colour)) {
        return "hexa";
    }
    if (/^(hsl\()?(\d{1,3}),\s?\d{1,3}%,\s?\d{1,3}%\)?$/.test(colour)) {
        return "hsl";
    }
    if (/^(hsla\()?(\d{1,3}),\s?\d{1,3}%,\s?\d{1,3}%,\s?\d{1}\.\d{0,5}\)?$/.test(colour)) {
        return "hsla";
    }
    if (/^(rgb\()?\d{1,3},\s?\d{1,3},\s?\d{1,3}\)?$/.test(colour)) {
        return "rgb";
    }
    if (/^(?:rgba\()?\d{1,3},\s?\d{1,3},\s?\d{1,3},\s?\d{1}\.\d{1,5}\)?$/.test(colour)) {
        return "rgba";
    }
    return null;
}

function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    return `#${((1 << 24) + (parseInt(result[0]) << 16) + (parseInt(result[1]) << 8) + parseInt(result[2])).toString(16).slice(1)}`;
}

function hslToRgb(hsl) {
    const result = hsl.match(/(\d+\.?\d*)/g);
    const h = parseFloat(result[0]) / 360;
    const s = parseFloat(result[1]) / 100;
    const l = parseFloat(result[2]) / 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    const result = rgb.match(/\d+/g);
    const r = parseInt(result[0]) / 255;
    const g = parseInt(result[1]) / 255;
    const b = parseInt(result[2]) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function extractOpacity(colour) {
    const match = colour.match(/(?:hsla|rgba)\(([^)]+)\)/);
    if (match) {
        const values = match[1].split(',').map(v => v.trim());
        return values.length === 4 ? parseFloat(values[3]) : 1;
    }
    return 1;
}

function addOpacity(colour, opacity) {
    const format = detectFormat(colour);
    if (format === "rgba" || format === "hsla") {
        return colour.replace(/(\d(\.\d+)?)(\))/, `${opacity}$3`);
    }
    if (format === "rgb") {
        const rgbValues = colour.match(/\d+/g);
        return `rgba(${rgbValues.join(', ')}, ${opacity})`;
    }
    if (format === "hsl") {
        const hslValues = colour.match(/(\d+\.?\d*)/g);
        return `hsla(${hslValues[0]}, ${hslValues[1]}%, ${hslValues[2]}%, ${opacity})`;
    }
    if (format === "hex" || format === "hexa") {
        const hex = colour.startsWith("#") ? colour : `#${colour}`;
        return hex.length === 7 ? `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : hex;
    }
    return colour;
}

export default function Command() {
    const { handleSubmit, itemProps } = useForm({
        onSubmit(values) {
            handleConvert(values.colour);
        },
        validation: {
            colour: FormValidation.Required,
        },
    });
    const [converted, setConverted] = useState(false);
    const [convertedColour, setConvertedColour] = useState({});
    const [inputFormat, setInputFormat] = useState('');
    const handleConvert = (colour) => {
        const format = detectFormat(colour);
        setInputFormat(format);
        if (!format) {
            showToast({
                style: Toast.Style.Failure,
                title: "Invalid Colour Format",
                message: "Please enter a valid hex, RGB, HSL, or other supported colour format.",
            });
            return;
        }
        // the lines below were absolutely miserable to write, especially the ones with transparency
        switch (format) {
            case "hex":
                const hex = colour.startsWith("#") ? colour : `#${colour}`;
                const rgb = hexToRgb(hex);
                const hsl = hexToHsl(hex);
                setConvertedColour({ hex, rgb, hsl });
                setConverted(true);
                break;
            case "rgb":
                const rgbValue = colour.startsWith("rgb") ? colour : `rgb(${colour})`;
                const hexFromRgb = rgbToHex(rgbValue);
                const hslFromRgb = hexToHsl(hexFromRgb);
                setConvertedColour({ hex: hexFromRgb, rgb: rgbValue, hsl: hslFromRgb });
                setConverted(true);
                break;
            case "hsl":
                const hslValue = colour.startsWith("hsl") ? colour : `hsl(${colour})`;
                const rgbFromHsl = hslToRgb(hslValue);
                const hexFromHsl = rgbToHex(rgbFromHsl);
                setConvertedColour({ hex: hexFromHsl, rgb: rgbFromHsl, hsl: hslValue });
                setConverted(true);
                break;
            case "hexa":
                const hexa = colour.startsWith("#") ? colour : `#${colour}`;
                const rgbFromHexa = hexToRgb(hexa);
                const hslFromHexa = hexToHsl(hexa);
                const opacity = extractOpacity(hexa);
                setConvertedColour({
                    hex: hexa,
                    rgb: addOpacity(rgbFromHexa, opacity),
                    hsl: addOpacity(hslFromHexa, opacity),
                });
                setConverted(true);
                break;
            case "hsla":
                const hsla = colour.startsWith("hsla") ? colour : `hsla(${colour})`;
                const rgbFromHsla = hslToRgb(hsla);
                const hexFromHsla = rgbToHex(rgbFromHsla);
                const opacityFromHsla = extractOpacity(hsla);
                setConvertedColour({
                    hex: hexFromHsla,
                    rgb: addOpacity(rgbFromHsla, opacityFromHsla),
                    hsl: hsla,
                });
                setConverted(true);
                break;
            case "rgba":
                const rgba = colour.startsWith("rgba") ? colour : `rgba(${colour})`;
                const rgbFromRgba = rgba.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/, 'rgb($1, $2, $3)');
                const hexFromRgba = rgbToHex(rgbFromRgba);
                const opacityFromRgba = rgba.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)[1];
                setConvertedColour({
                    hex: addOpacity(hexFromRgba, opacityFromRgba),
                    rgb: addOpacity(rgbFromRgba, opacityFromRgba),
                    hsl: addOpacity(hexToHsl(hexFromRgba), opacityFromRgba),
                });
                setConverted(true);
                break;
        }
    };
    return (
        <>
            {converted && (
                <Detail
                    markdown={`### Converted Colour\n\n- **Hex:** ${convertedColour.hex}\n- **RGB:** ${convertedColour.rgb}\n- **HSL:** ${convertedColour.hsl}`}
                    actions={
                        <ActionPanel>
                            <Action.CopyToClipboard content={convertedColour.hex} title="Copy Hex" />
                            <Action.CopyToClipboard content={convertedColour.rgb} title="Copy RGB" />
                            <Action.CopyToClipboard content={convertedColour.hsl} title="Copy HSL" />
                            <Action title="Convert Another Colour" onAction={() => setConverted(false)} />
                        </ActionPanel>
                    }
                />
            )}
            {!converted && (
                <Form
                    actions={
                        <ActionPanel>
                            <Action.SubmitForm title="Convert" onSubmit={handleSubmit} />
                        </ActionPanel>
                    }
                >
                    <Form.TextField title="Input Colour" placeholder="Hex/RGB/HSL" {...itemProps.colour} />
                </Form >
            )}
        </>
    );
}