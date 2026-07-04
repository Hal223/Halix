import App from 'resource:///com/github/Aylur/ags/app.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { Bar } from './widgets/bar.js';
import { AudioPopup, NetworkPopup } from './widgets/popups.js';

const scss = App.configDir + '/style.scss';
const css = '/tmp/ags-style.css';

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
