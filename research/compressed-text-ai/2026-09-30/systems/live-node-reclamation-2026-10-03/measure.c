#define _POSIX_C_SOURCE 200809L
#include <sys/wait.h>
#include <sys/resource.h>
#include <time.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
static double now(void){struct timespec t;clock_gettime(CLOCK_MONOTONIC,&t);return t.tv_sec+t.tv_nsec*1e-9;}
int main(int argc,char **argv){
    if(argc<2)return 2;
    double t=now();pid_t p=fork();if(p<0)return 2;
    if(!p){execv(argv[1],argv+1);perror("execv");_exit(127);}
    int status;struct rusage u;if(wait4(p,&status,0,&u)<0)return 2;
    fprintf(stderr,"{\"measurement\":true,\"wall_s\":%.9f,\"cpu_s\":%.9f,\"peak_rss_kib\":%ld}\n",now()-t,u.ru_utime.tv_sec+u.ru_utime.tv_usec*1e-6+u.ru_stime.tv_sec+u.ru_stime.tv_usec*1e-6,u.ru_maxrss);
    return WIFEXITED(status)?WEXITSTATUS(status):128+WTERMSIG(status);
}
