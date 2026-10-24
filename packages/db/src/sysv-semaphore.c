/* Darwin-only helper. Native headers avoid guessing libc's IPC_STAT ABI. */
#include <sys/sem.h>
#include <unistd.h>
#include <signal.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static int snapshot(int id, struct semid_ds *ds, int *marker, int *pid) {
    union semun arg;
    arg.buf = ds;
    if (semctl(id, 0, IPC_STAT, arg) == -1) return 0;
    if (ds->sem_nsems != 17) return 0;
    *marker = semctl(id, 16, GETVAL);
    *pid = semctl(id, 16, GETPID);
    return *marker >= 0 && *pid > 0;
}

int main(int argc, char **argv) {
    if (argc < 2 || (strcmp(argv[1], "inspect") && strcmp(argv[1], "remove"))) return 1;
    int apply = !strcmp(argv[1], "remove");
    for (int i = 2; i < argc; i++) {
        int id, expected_pid, consumed = 0;
        long long expected_time;
        unsigned int expected_key;
        if (sscanf(argv[i], "%d:%lld:%d:%u%n", &id, &expected_time, &expected_pid,
                   &expected_key, &consumed) != 4 || argv[i][consumed] || id < 0) return 1;
        struct semid_ds ds;
        int marker, pid;
        if (!snapshot(id, &ds, &marker, &pid)) continue;
        int dead = 0;
        if (kill(pid, 0) == -1 && errno == ESRCH) dead = 1;
        if (!apply) {
            printf("%d %u %u %lld %d %d %d %u\n", id, ds.sem_perm.uid,
                   ds.sem_nsems, (long long)ds.sem_ctime, marker, pid, dead,
                   (unsigned int)ds.sem_perm._key);
            continue;
        }
        /* Every condition is rechecked here, immediately before IPC_RMID. */
        if (ds.sem_perm.uid != getuid() || marker != 537 || !dead ||
            difftime(time(NULL), ds.sem_ctime) < 300 ||
            (long long)ds.sem_ctime != expected_time || pid != expected_pid ||
            (unsigned int)ds.sem_perm._key != expected_key) continue;
        if (semctl(id, 0, IPC_RMID) == -1) {
            printf("%d failed\n", id);
        } else {
            printf("%d removed\n", id);
        }
        fflush(stdout);
    }
    return 0;
}
