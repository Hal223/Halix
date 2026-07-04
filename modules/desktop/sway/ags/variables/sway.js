import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { JQ_PATH } from '../vars.js';

// Sway Workspaces
export const swayWorkspaces = Variable([], {
    listen: [['swaymsg', '-t', 'subscribe', '["workspace"]'], () => {
        try {
            const res = Utils.exec('swaymsg -t get_workspaces');
            return JSON.parse(res);
        } catch (e) {
            console.error(`Failed to parse workspaces: ${e}`);
            return [];
        }
    }],
});

// Initialize workspace asynchronously to avoid blocking on startup
Utils.execAsync('swaymsg -t get_workspaces')
    .then(out => {
        try {
            swayWorkspaces.value = JSON.parse(out);
        } catch (e) {
            console.error(`Failed to parse initial workspaces: ${e}`);
        }
    })
    .catch(err => console.error(`Failed to fetch initial workspaces: ${err}`));

// Window Title
export const windowTitle = Variable("", {
    listen: [['swaymsg', '-t', 'subscribe', '["window"]'], out => {
        try {
            const data = JSON.parse(out);
            if (data.change === "focus" || data.change === "title") {
                return data.container.name || "";
            }
        } catch (e) {
            console.error(`Failed to parse window event: ${e}`);
        }
        
        // Fallback if the event didn't contain what we need
        try {
            return Utils.exec(`sh -c "swaymsg -t get_tree | ${JQ_PATH} -r '.. | select(.type?) | select(.focused==true).name'"`) || "";
        } catch (e) {
            console.error(`Failed to fetch window title fallback: ${e}`);
            return "";
        }
    }]
});

// Initialize window title asynchronously
Utils.execAsync(`sh -c "swaymsg -t get_tree | ${JQ_PATH} -r '.. | select(.type?) | select(.focused==true).name'"`)
    .then(out => windowTitle.value = out || "")
    .catch(err => console.error(`Failed to fetch initial window title: ${err}`));
