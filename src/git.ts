import git, {ReadCommitResult} from 'isomorphic-git';
import * as fs from 'fs';
import http from 'isomorphic-git/http/node';


export const listRefs = (gitPath: string): Promise<{name: string, branches: string[]}[]> => {
    return new Promise((resolve, reject) => {
        git.listRemotes({
            fs,
            dir: gitPath
        }).then(remotes => {
            let branchesPromises: Promise<{name: string, branches: string[]}>[] = [];
            remotes.forEach(remote => {
                branchesPromises.push(git.listBranches({
                    fs,
                    dir: gitPath,
                    remote: remote.remote
                }).then(branches => {
                    return {name: remote.remote, branches};
                }));
            });
            Promise.all(branchesPromises).then(data => {
                resolve(data);
            });
        });
    });
};


export const fetchRemotes = (gitPath: string, remotes: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        let promises: Promise<any>[] = [];
        remotes.forEach(remote => {
            promises.push(git.fetch({
                fs,
                http,
                dir: gitPath,
                remote: remote
            }));
        });
        Promise.all(promises).then(() => {
            resolve();
        });
    });
};


export const logRemoteBranch = (gitPath: string, remote: string, branch: string, since: Date|undefined): Promise<ReadCommitResult[]> => {
    return git.log({
        fs,
        dir: gitPath,
        ref: `remotes/${remote}/${branch}`,
        since: since
    });
};
