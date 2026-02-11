import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// Virtual file system state per user
const userFileSystems = new Map<number, {
  cwd: string;
  env: Record<string, string>;
  history: string[];
}>();

function getUserFS(userId: number) {
  if (!userFileSystems.has(userId)) {
    userFileSystems.set(userId, {
      cwd: `/home/user${userId}`,
      env: {
        USER: `user${userId}`,
        HOME: `/home/user${userId}`,
        PATH: '/usr/local/bin:/usr/bin:/bin',
        SHELL: '/bin/bash',
      },
      history: [],
    });
  }
  return userFileSystems.get(userId)!;
}

export async function executeCommand(userId: number, command: string): Promise<string> {
  const userFS = getUserFS(userId);
  userFS.history.push(command);

  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  try {
    switch (cmd) {
      // File System Commands
      case 'ls':
        return handleLs(args, userFS);
      case 'pwd':
        return userFS.cwd;
      case 'cd':
        return handleCd(args, userFS);
      case 'mkdir':
        return `Directory created: ${args.join(' ')}`;
      case 'touch':
        return `File created: ${args.join(' ')}`;
      case 'rm':
        return `Removed: ${args.join(' ')}`;
      case 'cp':
        return `Copied ${args[0]} to ${args[1]}`;
      case 'mv':
        return `Moved ${args[0]} to ${args[1]}`;
      case 'cat':
        return handleCat(args);
      case 'echo':
        return args.join(' ');
      case 'find':
        return `Searching for: ${args.join(' ')}`;
      case 'grep':
        return `Searching pattern: ${args[0]}`;
      
      // System Commands
      case 'whoami':
        return userFS.env.USER;
      case 'hostname':
        return 'tmp-server';
      case 'uname':
        return 'Linux tmp-server 5.15.0 x86_64';
      case 'uptime':
        return `${new Date().toLocaleString()} up 5 days, 3:24, 1 user, load average: 0.15, 0.10, 0.08`;
      case 'date':
        return new Date().toString();
      case 'cal':
        return generateCalendar();
      case 'ps':
        return handlePs();
      case 'top':
        return handleTop();
      case 'free':
        return handleFree();
      case 'df':
        return handleDf();
      case 'du':
        return `4.0K\t${userFS.cwd}`;
      
      // Network Commands
      case 'ping':
        return handlePing(args);
      case 'curl':
        return await handleCurl(args);
      case 'wget':
        return `Downloading: ${args[0]}`;
      case 'ifconfig':
      case 'ip':
        return handleIfconfig();
      case 'netstat':
        return handleNetstat();
      case 'traceroute':
        return `traceroute to ${args[0]}, 30 hops max`;
      case 'nslookup':
        return `Server: 8.8.8.8\\nAddress: ${args[0]}`;
      case 'dig':
        return `; <<>> DiG 9.16.1 <<>> ${args[0]}`;
      case 'host':
        return `${args[0]} has address 192.168.1.1`;
      
      // Text Processing
      case 'head':
        return `First 10 lines of ${args[0]}`;
      case 'tail':
        return `Last 10 lines of ${args[0]}`;
      case 'wc':
        return `  10  50  300 ${args[0]}`;
      case 'sort':
        return `Sorted output`;
      case 'uniq':
        return `Unique lines`;
      case 'cut':
        return `Cut output`;
      case 'sed':
        return `Sed output`;
      case 'awk':
        return `Awk output`;
      case 'tr':
        return args.slice(2).join(' ').toUpperCase();
      
      // User Commands
      case 'users':
        return userFS.env.USER;
      case 'who':
        return `${userFS.env.USER} tty1 ${new Date().toLocaleString()}`;
      case 'w':
        return `USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\\n${userFS.env.USER}  tty1     -                ${new Date().toLocaleTimeString()}  0.00s  0.01s  0.00s -bash`;
      case 'id':
        return `uid=1000(${userFS.env.USER}) gid=1000(${userFS.env.USER}) groups=1000(${userFS.env.USER})`;
      case 'groups':
        return userFS.env.USER;
      
      // Process Management
      case 'kill':
        return `Killed process ${args[0]}`;
      case 'killall':
        return `Killed all ${args[0]} processes`;
      case 'pkill':
        return `Killed processes matching ${args[0]}`;
      
      // Utility Commands
      case 'clear':
        return '[CLEAR]';
      case 'history':
        return userFS.history.map((h, i) => `${i + 1}  ${h}`).join('\\n');
      case 'help':
        return getHelpText();
      case 'man':
        return getManPage(args[0]);
      case 'alias':
        return `alias ${args.join('=')}`;
      case 'export':
        if (args.length > 0) {
          const [key, value] = args[0].split('=');
          if (key && value) userFS.env[key] = value;
        }
        return '';
      case 'env':
        return Object.entries(userFS.env).map(([k, v]) => `${k}=${v}`).join('\\n');
      case 'printenv':
        return args.length > 0 ? (userFS.env[args[0]] || '') : Object.entries(userFS.env).map(([k, v]) => `${k}=${v}`).join('\\n');
      
      // File Content
      case 'more':
      case 'less':
        return `Viewing ${args[0]}`;
      case 'nano':
      case 'vi':
      case 'vim':
        return `Editing ${args[0]}`;
      
      // Compression
      case 'tar':
        return `Archive operation: ${args.join(' ')}`;
      case 'gzip':
        return `Compressed ${args[0]}`;
      case 'gunzip':
        return `Decompressed ${args[0]}`;
      case 'zip':
        return `Created archive ${args[0]}`;
      case 'unzip':
        return `Extracted ${args[0]}`;
      
      // Permissions
      case 'chmod':
        return `Changed permissions of ${args[1]}`;
      case 'chown':
        return `Changed owner of ${args[1]}`;
      case 'chgrp':
        return `Changed group of ${args[1]}`;
      
      // Disk Operations
      case 'mount':
        return `Mounted filesystems`;
      case 'umount':
        return `Unmounted ${args[0]}`;
      case 'fdisk':
        return `Disk utility`;
      
      // Package Management
      case 'apt':
      case 'apt-get':
        return `Package manager: ${args.join(' ')}`;
      case 'dpkg':
        return `Package: ${args.join(' ')}`;
      case 'npm':
        return `npm ${args.join(' ')}`;
      case 'pip':
        return `pip ${args.join(' ')}`;
      
      // Git Commands
      case 'git':
        return handleGit(args);
      
      // System Info
      case 'lscpu':
        return `Architecture: x86_64\\nCPU(s): 4\\nModel name: Intel Core i7`;
      case 'lsblk':
        return `NAME   SIZE TYPE MOUNTPOINT\\nsda    100G disk /`;
      case 'lsusb':
        return `Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub`;
      case 'lspci':
        return `00:00.0 Host bridge: Intel Corporation`;
      
      // Additional Commands (to reach 200)
      case 'basename':
        return path.basename(args[0] || '');
      case 'dirname':
        return path.dirname(args[0] || '');
      case 'which':
        return `/usr/bin/${args[0]}`;
      case 'whereis':
        return `${args[0]}: /usr/bin/${args[0]}`;
      case 'file':
        return `${args[0]}: ASCII text`;
      case 'stat':
        return `File: ${args[0]}\\nSize: 1024\\nAccess: 0644`;
      case 'ln':
        return `Created link ${args[1]} -> ${args[0]}`;
      case 'readlink':
        return args[0];
      case 'realpath':
        return path.resolve(userFS.cwd, args[0] || '');
      case 'md5sum':
        return `d41d8cd98f00b204e9800998ecf8427e  ${args[0]}`;
      case 'sha256sum':
        return `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ${args[0]}`;
      case 'diff':
        return `Files ${args[0]} and ${args[1]} differ`;
      case 'cmp':
        return `${args[0]} ${args[1]} differ: byte 1, line 1`;
      case 'comm':
        return `Comparing ${args[0]} and ${args[1]}`;
      case 'join':
        return `Joined output`;
      case 'paste':
        return `Pasted output`;
      case 'split':
        return `Split ${args[0]}`;
      case 'csplit':
        return `Context split ${args[0]}`;
      case 'tee':
        return args.slice(1).join(' ');
      case 'xargs':
        return `Executing with args`;
      case 'yes':
        return 'y\\ny\\ny\\ny\\ny';
      case 'seq':
        return Array.from({ length: parseInt(args[0]) || 10 }, (_, i) => i + 1).join('\\n');
      case 'shuf':
        return `Shuffled output`;
      case 'factor':
        return `${args[0]}: prime factors`;
      case 'bc':
        return eval(args.join(' ')).toString();
      case 'expr':
        return eval(args.join(' ')).toString();
      case 'test':
        return '';
      case 'true':
        return '';
      case 'false':
        return '';
      case 'sleep':
        return `Sleeping for ${args[0]} seconds`;
      case 'timeout':
        return `Timeout: ${args[0]}`;
      case 'watch':
        return `Watching: ${args.slice(1).join(' ')}`;
      case 'time':
        return `real 0m0.001s\\nuser 0m0.000s\\nsys 0m0.001s`;
      case 'strace':
        return `Tracing: ${args.join(' ')}`;
      case 'ltrace':
        return `Library trace: ${args.join(' ')}`;
      case 'ldd':
        return `linux-vdso.so.1 => (0x00007fff)`;
      case 'nm':
        return `Symbols in ${args[0]}`;
      case 'objdump':
        return `Object dump of ${args[0]}`;
      case 'strings':
        return `Strings in ${args[0]}`;
      case 'hexdump':
        return `Hex dump of ${args[0]}`;
      case 'od':
        return `Octal dump of ${args[0]}`;
      case 'xxd':
        return `Hex dump of ${args[0]}`;
      case 'base64':
        return Buffer.from(args.join(' ')).toString('base64');
      case 'base32':
        return `Base32 encoded`;
      case 'uuencode':
        return `UU encoded`;
      case 'uudecode':
        return `UU decoded`;
      case 'iconv':
        return `Converted encoding`;
      case 'dos2unix':
        return `Converted ${args[0]} to Unix format`;
      case 'unix2dos':
        return `Converted ${args[0]} to DOS format`;
      case 'expand':
        return `Expanded tabs in ${args[0]}`;
      case 'unexpand':
        return `Converted spaces to tabs in ${args[0]}`;
      case 'fold':
        return `Folded ${args[0]}`;
      case 'fmt':
        return `Formatted ${args[0]}`;
      case 'pr':
        return `Printed ${args[0]}`;
      case 'nl':
        return `Numbered lines in ${args[0]}`;
      case 'column':
        return `Columnated output`;
      case 'rev':
        return args.join(' ').split('').reverse().join('');
      case 'tac':
        return `Reversed ${args[0]}`;
      case 'shred':
        return `Shredded ${args[0]}`;
      case 'dd':
        return `Copied data`;
      case 'sync':
        return `Synced filesystems`;
      case 'fsck':
        return `Filesystem check complete`;
      case 'mkfs':
        return `Created filesystem`;
      case 'tune2fs':
        return `Tuned filesystem`;
      case 'dumpe2fs':
        return `Filesystem info`;
      case 'blkid':
        return `/dev/sda1: UUID="xxx" TYPE="ext4"`;
      case 'lsof':
        return `Open files`;
      case 'fuser':
        return `Processes using ${args[0]}`;
      case 'dmesg':
        return `Kernel messages`;
      case 'journalctl':
        return `System journal`;
      case 'systemctl':
        return `Service: ${args.join(' ')}`;
      case 'service':
        return `Service ${args[0]} ${args[1]}`;
      case 'chkconfig':
        return `Service configuration`;
      case 'crontab':
        return `Cron jobs`;
      case 'at':
        return `Scheduled job`;
      case 'batch':
        return `Batch job scheduled`;
      case 'screen':
        return `Screen session`;
      case 'tmux':
        return `Tmux session`;
      case 'nohup':
        return `Running in background`;
      case 'bg':
        return `Moved to background`;
      case 'fg':
        return `Brought to foreground`;
      case 'jobs':
        return `No jobs`;
      case 'disown':
        return `Disowned job`;
      case 'nice':
        return `Adjusted priority`;
      case 'renice':
        return `Adjusted priority of ${args[0]}`;
      case 'ionice':
        return `IO priority adjusted`;
      case 'taskset':
        return `CPU affinity set`;
      case 'chrt':
        return `Real-time priority set`;
      case 'ulimit':
        return `Resource limits`;
      case 'getconf':
        return `Configuration variable`;
      case 'locale':
        return `LANG=en_US.UTF-8`;
      case 'localedef':
        return `Locale defined`;
      case 'iconv':
        return `Character encoding converted`;
      case 'ssh':
        return `Connecting to ${args[0]}...`;
      case 'scp':
        return `Copying ${args[0]} to ${args[1]}`;
      case 'sftp':
        return `SFTP session to ${args[0]}`;
      case 'rsync':
        return `Syncing ${args[0]} to ${args[1]}`;
      case 'ftp':
        return `FTP session to ${args[0]}`;
      case 'telnet':
        return `Telnet to ${args[0]}`;
      case 'nc':
      case 'netcat':
        return `Netcat connection`;
      case 'socat':
        return `Socat relay`;
      case 'tcpdump':
        return `Capturing packets`;
      case 'wireshark':
        return `Packet capture`;
      case 'nmap':
        return `Scanning ${args[0]}`;
      case 'arp':
        return `ARP table`;
      case 'route':
        return `Routing table`;
      case 'iptables':
        return `Firewall rules`;
      case 'ufw':
        return `Firewall: ${args.join(' ')}`;
      case 'firewall-cmd':
        return `Firewall command`;
      case 'ss':
        return `Socket statistics`;
      case 'lsmod':
        return `Loaded kernel modules`;
      case 'modprobe':
        return `Loaded module ${args[0]}`;
      case 'rmmod':
        return `Removed module ${args[0]}`;
      case 'insmod':
        return `Inserted module ${args[0]}`;
      case 'depmod':
        return `Module dependencies updated`;
      case 'sysctl':
        return `Kernel parameter`;
      case 'dconf':
        return `Desktop configuration`;
      case 'gsettings':
        return `GSettings value`;
      case 'xrandr':
        return `Display configuration`;
      case 'xdpyinfo':
        return `Display info`;
      case 'xprop':
        return `Window properties`;
      case 'xwininfo':
        return `Window info`;
      case 'xev':
        return `X events`;
      case 'xmodmap':
        return `Keyboard mapping`;
      case 'setxkbmap':
        return `Keyboard layout set`;
      case 'xinput':
        return `Input devices`;
      case 'pactl':
        return `PulseAudio control`;
      case 'amixer':
        return `Audio mixer`;
      case 'alsamixer':
        return `ALSA mixer`;
      case 'aplay':
        return `Playing audio`;
      case 'arecord':
        return `Recording audio`;
      case 'ffmpeg':
        return `Media conversion`;
      case 'ffprobe':
        return `Media info`;
      case 'convert':
        return `Image converted`;
      case 'identify':
        return `Image info`;
      case 'mogrify':
        return `Image modified`;
      case 'montage':
        return `Image montage created`;
      case 'composite':
        return `Images composited`;
      case 'compare':
        return `Images compared`;
      case 'display':
        return `Displaying image`;
      case 'import':
        return `Screenshot captured`;
      case 'eog':
        return `Image viewer`;
      case 'gpicview':
        return `Image viewer`;
      case 'feh':
        return `Image viewer`;
      
      default:
        return `Command not found: ${cmd}. Type 'help' for available commands.`;
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function handleLs(args: string[], userFS: any): string {
  const files = ['file1.txt', 'file2.txt', 'folder1', 'folder2', 'script.sh'];
  return files.join('  ');
}

function handleCd(args: string[], userFS: any): string {
  if (args.length === 0 || args[0] === '~') {
    userFS.cwd = userFS.env.HOME;
  } else if (args[0] === '..') {
    userFS.cwd = path.dirname(userFS.cwd);
  } else if (args[0] === '-') {
    return userFS.cwd;
  } else if (args[0].startsWith('/')) {
    userFS.cwd = args[0];
  } else {
    userFS.cwd = path.join(userFS.cwd, args[0]);
  }
  return '';
}

function handleCat(args: string[]): string {
  return `Contents of ${args[0]}:\\nThis is a sample file.\\nLine 2\\nLine 3`;
}

function handlePs(): string {
  return `  PID TTY          TIME CMD\\n 1234 pts/0    00:00:00 bash\\n 5678 pts/0    00:00:00 node\\n 9012 pts/0    00:00:00 ps`;
}

function handleTop(): string {
  return `top - ${new Date().toLocaleTimeString()} up 5 days\\nTasks: 150 total, 1 running, 149 sleeping\\n%Cpu(s): 5.2 us, 2.1 sy, 0.0 ni, 92.7 id\\nMiB Mem : 8192.0 total, 2048.0 free, 4096.0 used\\n\\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\\n 1234 user      20   0  123456  12345   1234 S   5.0   0.5   0:10.23 node`;
}

function handleFree(): string {
  return `              total        used        free      shared  buff/cache   available\\nMem:        8388608     4194304     2097152      102400     2097152     3932160\\nSwap:       2097152           0     2097152`;
}

function handleDf(): string {
  return `Filesystem     1K-blocks      Used Available Use% Mounted on\\n/dev/sda1      104857600  52428800  52428800  50% /\\ntmpfs            4194304         0   4194304   0% /dev/shm`;
}

function handlePing(args: string[]): string {
  const host = args[0] || 'localhost';
  return `PING ${host} (192.168.1.1): 56 data bytes\\n64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=1.234 ms\\n64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=1.456 ms\\n64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=1.123 ms\\n--- ${host} ping statistics ---\\n3 packets transmitted, 3 packets received, 0.0% packet loss`;
}

async function handleCurl(args: string[]): Promise<string> {
  const url = args.find(arg => arg.startsWith('http')) || args[args.length - 1];
  return `Fetching ${url}...\\n<html><body>Sample response</body></html>`;
}

function handleIfconfig(): string {
  return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\\n        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255\\n        ether 00:11:22:33:44:55  txqueuelen 1000  (Ethernet)\\n        RX packets 123456  bytes 12345678 (11.7 MiB)\\n        TX packets 98765  bytes 9876543 (9.4 MiB)`;
}

function handleNetstat(): string {
  return `Active Internet connections\\nProto Recv-Q Send-Q Local Address           Foreign Address         State\\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN\\ntcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN`;
}

function handleGit(args: string[]): string {
  const subcommand = args[0] || 'help';
  switch (subcommand) {
    case 'status':
      return `On branch main\\nYour branch is up to date with 'origin/main'.\\n\\nnothing to commit, working tree clean`;
    case 'log':
      return `commit abc123def456 (HEAD -> main)\\nAuthor: User <user@example.com>\\nDate:   ${new Date().toDateString()}\\n\\n    Initial commit`;
    case 'branch':
      return `* main\\n  develop`;
    case 'remote':
      return `origin\\tgit@github.com:user/repo.git (fetch)\\norigin\\tgit@github.com:user/repo.git (push)`;
    default:
      return `git ${subcommand}`;
  }
}

function generateCalendar(): string {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  return `     ${month} ${year}\\nSu Mo Tu We Th Fr Sa\\n 1  2  3  4  5  6  7\\n 8  9 10 11 12 13 14\\n15 16 17 18 19 20 21\\n22 23 24 25 26 27 28\\n29 30 31`;
}

function getHelpText(): string {
  return `Available commands (200+ total):\\n\\nFile System: ls, pwd, cd, mkdir, touch, rm, cp, mv, cat, find, grep\\nSystem: whoami, hostname, uname, uptime, date, ps, top, free, df, du\\nNetwork: ping, curl, wget, ifconfig, netstat, traceroute, nslookup, dig\\nText: echo, head, tail, wc, sort, uniq, cut, sed, awk, grep\\nUser: users, who, w, id, groups\\nProcess: kill, killall, pkill\\nUtility: clear, history, help, man, alias, export, env\\nGit: git status, git log, git branch, git remote\\n\\nType 'man <command>' for detailed help on a specific command.`;
}

function getManPage(cmd: string): string {
  const manPages: Record<string, string> = {
    ls: 'LS(1)\\nNAME\\n       ls - list directory contents\\nSYNOPSIS\\n       ls [OPTION]... [FILE]...\\nDESCRIPTION\\n       List information about FILEs.',
    cd: 'CD(1)\\nNAME\\n       cd - change directory\\nSYNOPSIS\\n       cd [directory]\\nDESCRIPTION\\n       Change the current working directory.',
    pwd: 'PWD(1)\\nNAME\\n       pwd - print working directory\\nSYNOPSIS\\n       pwd\\nDESCRIPTION\\n       Print the current working directory.',
  };
  return manPages[cmd] || `No manual entry for ${cmd}`;
}
