import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { JQ_PATH } from '../vars.js';

export const appIcons = {
    'firefox': '',
    'google-chrome': '',
    'chromium': '',
    'brave-browser': '',
    'kitty': '',
    'alacritty': '',
    'foot': '',
    'wezterm': '',
    'discord': '',
    'vesktop': '',
    'spotify': '',
    'steam': '',
    'org.telegram.desktop': '',
    'code': '',
    'code-oss': '',
    'vscodium': '',
    'thunar': '',
    'nautilus': '',
    'dolphin': '',
    'obs': '',
    'mpv': '',
    'vlc': '',
    'default': ''
};

function updateWorkspaces() {
    try {
        const res = Utils.exec('swaymsg -t get_workspaces');
        const workspaces = JSON.parse(res);
        const treeRes = Utils.exec('swaymsg -t get_tree');
        const tree = JSON.parse(treeRes);
        
        const appsMap = {};
        function traverse(node, currentWorkspace) {
            if (node.type === 'workspace') currentWorkspace = node.name;
            else if (node.type === 'con' || node.type === 'floating_con') {
                if (currentWorkspace && node.name) {
                    const appId = (node.app_id || node.window_properties?.class || '').toLowerCase();
                    if (appId) {
                        if (!appsMap[currentWorkspace]) appsMap[currentWorkspace] = [];
                        appsMap[currentWorkspace].push(appId);
                    }
                }
            }
            for (const child of node.nodes || []) traverse(child, currentWorkspace);
            for (const child of node.floating_nodes || []) traverse(child, currentWorkspace);
        }
        traverse(tree, null);
        
        return workspaces.map(ws => ({
            ...ws,
            apps: appsMap[ws.name] || []
        }));
    } catch (e) {
        console.error(`Failed to parse workspaces: ${e}`);
        return [];
    }
}

// Sway Workspaces
export const swayWorkspaces = Variable([], {
    listen: [['swaymsg', '-m', '-t', 'subscribe', '["workspace", "window"]'], updateWorkspaces],
});

// Initialize workspace asynchronously to avoid blocking on startup
Utils.execAsync('swaymsg -t get_workspaces')
    .then(() => swayWorkspaces.value = updateWorkspaces())
    .catch(err => console.error(`Failed to fetch initial workspaces: ${err}`));

// Window Title
export const windowTitle = Variable("", {
    listen: [['swaymsg', '-m', '-t', 'subscribe', '["window"]'], out => {
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
