import App from 'resource:///com/github/Aylur/ags/app.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { Bar } from './widgets/bar.js';
import { AudioPopup, NetworkPopup } from './widgets/popups.js';

const scss = App.configDir + '/style.scss';
const css = '/tmp/ags-style.css';

// Read pywal colors and generate SCSS variables
try {
    const walColorsPath = '/home/hal/.cache/wal/colors.json';
    let pywal = null;
    
    try {
        const fileContent = Utils.readFile(walColorsPath);
        pywal = JSON.parse(fileContent);
    } catch (e) {
        console.error('Could not read wal colors.json, using fallback colors');
    }

    const colors = pywal ? {
        background: pywal.special.background,
        foreground: pywal.special.foreground,
        color0: pywal.colors.color0,
        color1: pywal.colors.color1,
        color2: pywal.colors.color2,
        color3: pywal.colors.color3,
        color4: pywal.colors.color4,
        color5: pywal.colors.color5,
        color6: pywal.colors.color6,
        color7: pywal.colors.color7,
        color8: pywal.colors.color8,
        color9: pywal.colors.color9,
        color10: pywal.colors.color10,
        color11: pywal.colors.color11,
        color12: pywal.colors.color12,
        color13: pywal.colors.color13,
        color14: pywal.colors.color14,
        color15: pywal.colors.color15,
    } : {
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        color0: '#45475a',
        color1: '#f38ba8',
        color2: '#a6e3a1',
        color3: '#f9e2af',
        color4: '#89b4fa',
        color5: '#f5c2e7',
        color6: '#94e2d5',
        color7: '#bac2de',
        color8: '#585b70',
        color9: '#f38ba8',
        color10: '#a6e3a1',
        color11: '#f9e2af',
        color12: '#89b4fa',
        color13: '#f5c2e7',
        color14: '#94e2d5',
        color15: '#a6adc8',
    };

    const varsScss = Object.entries(colors)
        .map(([key, value]) => `$${key}: ${value};`)
        .join('\\n');
        
    Utils.exec(`sh -c "echo -e '${varsScss}' > /tmp/ags-vars.scss"`);
} catch (error) {
    console.error(`Failed to generate SCSS variables: ${error}`);
}

// Compile scss to css synchronously using dart-sass
try {
    Utils.exec(`sass ${scss} ${css}`);
} catch (error) {
    console.error(`Failed to compile SCSS: ${error}`);
}

export default {
    style: css,
    windows: [
        Bar(0),
        Bar(1),
        AudioPopup(),
        NetworkPopup(),
    ],
};
