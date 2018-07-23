---
layout: post
title: 使用nvm管理node版本
date: 2017-12-20 
tags: [nvm, node]
---


#### 使用nvm安装node有什么优势？
- 安装node很方便，只需要一条命令
- 可以轻松切换node版本
- 可以多版本node并存
- 便于后期升级node版本到8.x

<!-- more -->

#### 使用curl安装nvm：
- 首先执行下面的命令安装nvm

{% highlight shell %}
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
{% endhighlight %}

- 完成后nvm就被安装在了~/.nvm下。

#### 配置环境变量
- 如果你也使用了zsh的话，就需要在~/.zshrc这个配置文件中配置，否则就找找看~/.bash_profile或者~/.profile。

- 打开~/.zshrc，在最后一行加上：

{% highlight shell %}
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
{% endhighlight %}

这一步的作用是每次新打开一个bash，nvm都会被自动添加到环境变量中。


#### 重启配置

- 执行下面命令：

{% highlight shell %}
source ~/.zshrc
{% endhighlight %}

- 输入nvm可以看到如下信息：

```
Node Version Manager

Note: <version> refers to any version-like string nvm understands. This includes:
  - full or partial version numbers, starting with an optional "v" (0.10, v0.1.2, v1)	
  - default (built-in) aliases: node, stable, unstable, iojs, system
  - custom aliases you define with `nvm alias foo`

Usage:
  nvm help                                  Show this message
  nvm --version                             Print out the latest released version of nvm
  nvm install [-s] <version>                Download and install a <version>, [-s] from source. Uses .nvmrc if available
  --reinstall-packages-from=<version>     When installing, reinstall packages installed in <node|iojs|node version number>
  nvm uninstall <version>                   Uninstall a version
  nvm use [--silent] <version>              Modify PATH to use <version>. Uses .nvmrc if available
  nvm exec [--silent] <version> [<command>] Run <command> on <version>. Uses .nvmrc if available
  nvm run [--silent] <version> [<args>]     Run `node` on <version> with <args> as arguments. Uses .nvmrc if available
  nvm current                               Display currently activated version
  nvm ls                                    List installed versions
  nvm ls <version>                          List versions matching a given description
  nvm ls-remote                             List remote versions available for install
  nvm version <version>                     Resolve the given description to a single local version
  nvm version-remote <version>              Resolve the given description to a single remote version
  nvm deactivate                            Undo effects of `nvm` on current shell
  nvm alias [<pattern>]                     Show all aliases beginning with <pattern>
  nvm alias <name> <version>                Set an alias named <name> pointing to <version>
  nvm unalias <name>                        Deletes the alias named <name>
  nvm reinstall-packages <version>          Reinstall global `npm` packages contained in <version> to current version
  nvm unload                                Unload `nvm` from shell
  nvm which [<version>]                     Display path to installed node version. Uses .nvmrc if available

Example:
  nvm install v0.10.32                  Install a specific version number
  nvm use 0.10                          Use the latest available 0.10.x release
  nvm run 0.10.32 app.js                Run app.js using node v0.10.32
  nvm exec 0.10.32 node app.js          Run `node app.js` with the PATH pointing to node v0.10.32
  nvm alias default 0.10.32             Set default node version on a shell

Note:
  to remove, delete, or uninstall nvm - just remove the `$NVM_DIR` folder (usually `~/.nvm`)
```


#### 使用nvm安装node
- 执行下面命令，查看可以安装的node版本

{% highlight shell %}
nvm ls-remote
{% endhighlight %}

目前sparta和saitama项目的线上机器使用的node版本都是 6.10.0， 所以建议本地机器也安装该版本。


- 安装对应版本node

{% highlight shell %}
nvm install v6.10.0
{% endhighlight %}


- 查看当前node版本命令

{% highlight shell %}
nvm current // 或者使用node -v
{% endhighlight %}

- 切换node版本号

{% highlight shell %}
nvm use v8.9.2
{% endhighlight %}

注：切换到该版本号之前请先安装该版本node

#### 设置nvm默认的node版本号
- 如果你本地有多个node版本并存， 并且出现了新开启terminal窗口时node版本会变的问题， 那么可以设置下nvm的默认node版本号（新的terminal开启时，会使用默认的node版本）

- 查看nvm默认的node版本号

{% highlight shell %}
nvm ls
{% endhighlight %}

执行上面命令时，会出现类似下面的执行结果：

```
->      v6.10.0
default -> 6.10.0 (-> v6.10.0)
node -> stable (-> v6.10.0) (default)
stable -> 6.10 (-> v6.10.0) (default)
iojs -> N/A (default)
lts/* -> lts/carbon (-> N/A)
lts/argon -> v4.8.6 (-> N/A)
lts/boron -> v6.12.1 (-> N/A)
lts/carbon -> v8.9.2 (-> N/A)
```

尾部带有"default"的行对应的版本号，即为nvm默认的node版本号。

- 设置nvm默认的node版本号

{% highlight shell %}
nvm alias default v6.10.0
{% endhighlight %}