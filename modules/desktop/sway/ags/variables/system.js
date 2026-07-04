import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import GLib from 'gi://GLib';

export const cpu = Variable(0, {
    poll: [2000, () => {
        return Utils.execAsync(['sh', '-c', 'vmstat 1 2 | tail -n 1'])
            .then(out => {
                const parts = out.trim().split(/\s+/);
                if (parts.length >= 15) {
                    const idle = parseInt(parts[14]);
                    return 100 - idle;
                }
                return 0;
            })
            .catch(() => 0);
    }],
});

export const ram = Variable(0, {
    poll: [2000, () => {
        try {
            const meminfo = Utils.readFile('/proc/meminfo');
            const lines = meminfo.split('\n');
            let total = 0, free = 0, buffers = 0, cached = 0;
            for (const line of lines) {
                if (line.startsWith('MemTotal:')) total = parseInt(line.split(/\s+/)[1]);
                if (line.startsWith('MemFree:')) free = parseInt(line.split(/\s+/)[1]);
                if (line.startsWith('Buffers:')) buffers = parseInt(line.split(/\s+/)[1]);
                if (line.startsWith('Cached:')) cached = parseInt(line.split(/\s+/)[1]);
            }
            if (total === 0) return 0;
            const used = total - free - buffers - cached;
            return Math.round((used / total) * 100);
        } catch (e) {
            return 0;
        }
    }],
});

export const temp = Variable(0, {
    poll: [2000, () => {
        try {
            const val = Utils.readFile('/sys/class/thermal/thermal_zone0/temp');
            return Math.round(parseInt(val) / 1000);
        } catch (e) {
            return 0;
        }
    }],
});

export const time = Variable(GLib.DateTime.new_now_local().format("%I:%M %p"), {
    poll: [1000, () => GLib.DateTime.new_now_local().format("%I:%M %p")],
});
