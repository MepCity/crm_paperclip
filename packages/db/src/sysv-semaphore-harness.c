/* Test-only syscall replacements: no real IPC calls or processes are changed. */
#include <sys/sem.h>
#include <unistd.h>
#include <signal.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdarg.h>
static const char *scenario;
static int removals;
static int fake_semctl(int id, int num, int command, ...) {
    (void)id; (void)num;
    if (!strcmp(scenario, "read-error")) return -1;
    if (command == IPC_STAT) {
        va_list args;
        va_start(args, command);
        union semun arg = va_arg(args, union semun);
        va_end(args);
        memset(arg.buf, 0, sizeof(*arg.buf));
        arg.buf->sem_perm.uid = !strcmp(scenario, "owner") ? 502 : 501;
        arg.buf->sem_perm._key = !strcmp(scenario, "key-reuse") ? 292 : 291;
        arg.buf->sem_nsems = !strcmp(scenario, "size") ? 1 : 17;
        arg.buf->sem_ctime = !strcmp(scenario, "young") ? 900 :
            !strcmp(scenario, "ctime-reuse") ? 2 : 1;
        return 0;
    }
    if (command == GETVAL) return !strcmp(scenario, "marker") ? 536 : 537;
    if (command == GETPID) return !strcmp(scenario, "pid-reuse") ? 766 :
        !strcmp(scenario, "zero-pid") ? 0 : 765;
    if (command == IPC_RMID) { removals++; return 0; }
    return -1;
}
static int fake_kill(pid_t pid, int sig) {
    (void)pid; (void)sig;
    if (!strcmp(scenario, "alive")) return 0;
    errno = !strcmp(scenario, "eperm") ? EPERM :
        !strcmp(scenario, "unknown") ? EINVAL : ESRCH;
    return -1;
}
static uid_t fake_getuid(void) { return 501; }
static time_t fake_time(time_t *out) { (void)out; return 1000; }
#define semctl fake_semctl
#define kill fake_kill
#define getuid fake_getuid
#define time fake_time
#define main helper_main
#include "sysv-semaphore.c"
#undef main
int main(int argc, char **argv) {
    if (argc != 2) return 1;
    scenario = argv[1];
    char *args[] = {"helper", "remove", "987:1:765:291"};
    int result = helper_main(3, args);
    printf("removals=%d\n", removals);
    return result;
}
