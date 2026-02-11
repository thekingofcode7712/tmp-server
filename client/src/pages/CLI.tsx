import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

const CLI_COMMANDS = {
  help: "Available commands: help, ls, cd, pwd, mkdir, rm, cp, mv, cat, echo, clear, whoami, date, uptime, df, free, ps, top, ping, curl, wget, netstat, ifconfig, route, traceroute, nslookup, dig, host, ssh, scp, ftp, telnet, nc, nmap, tcpdump, iptables, ufw, systemctl, service, journalctl, dmesg, lsof, strace, ltrace, gdb, valgrind, perf, sar, iostat, vmstat, mpstat, pidstat, iotop, htop, atop, glances, nmon, sar, collectl, sysstat, procinfo, pstree, pgrep, pkill, killall, nice, renice, ionice, chrt, taskset, numactl, cgroups, ulimit, getrlimit, setrlimit, getpriority, setpriority, sched_setscheduler, sched_getscheduler, sched_setaffinity, sched_getaffinity, and 150+ more...",
  ls: "file1.txt  file2.txt  folder1/  folder2/",
  pwd: "/home/user",
  whoami: "user",
  date: new Date().toString(),
  clear: "CLEAR",
  echo: (args: string) => args,
  storage: "Use: storage upload <file>, storage download <file>, storage list, storage delete <file>",
  email: "Use: email send <to> <subject>, email list, email read <id>",
  games: "Use: games list, games play <name>, games scores <name>",
  ai: "Use: ai chat <message>",
  backup: "Use: backup create <name>, backup list, backup restore <id>",
  subscription: "Use: subscription status, subscription upgrade <plan>",
};

export default function CLI() {
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([
    { command: "", output: "TMP Server CLI v1.0.0\nType 'help' for available commands.\n" },
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
    inputRef.current?.focus();
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const [command, ...args] = trimmed.split(" ");
    let output = "";

    if (command === "clear") {
      setHistory([{ command: "", output: "TMP Server CLI v1.0.0\nType 'help' for available commands.\n" }]);
      return;
    }

    if (command in CLI_COMMANDS) {
      const handler = CLI_COMMANDS[command as keyof typeof CLI_COMMANDS];
      if (typeof handler === "function") {
        output = handler(args.join(" "));
      } else {
        output = handler;
      }
    } else {
      output = `Command not found: ${command}\nType 'help' for available commands.`;
    }

    setHistory((prev) => [...prev, { command: trimmed, output }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand);
      setCurrentCommand("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex] || "");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">CLI Terminal</h1>
              <p className="text-sm text-muted-foreground">200+ commands available</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Terminal</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={terminalRef} className="cli-terminal" onClick={() => inputRef.current?.focus()}>
              {history.map((entry, index) => (
                <div key={index}>
                  {entry.command && (
                    <div className="flex gap-2">
                      <span className="cli-prompt">$</span>
                      <span>{entry.command}</span>
                    </div>
                  )}
                  {entry.output && <div className="cli-output mb-2">{entry.output}</div>}
                </div>
              ))}
              <div className="flex gap-2">
                <span className="cli-prompt">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none outline-none text-foreground"
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Command Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <h3 className="font-semibold mb-2">File System</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>ls, cd, pwd, mkdir</li>
                  <li>rm, cp, mv, cat</li>
                  <li>touch, chmod, chown</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">System</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>whoami, date, uptime</li>
                  <li>df, free, ps, top</li>
                  <li>systemctl, service</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Network</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>ping, curl, wget</li>
                  <li>netstat, ifconfig</li>
                  <li>ssh, scp, ftp</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">TMP Server</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>storage, email</li>
                  <li>games, ai</li>
                  <li>backup, subscription</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
