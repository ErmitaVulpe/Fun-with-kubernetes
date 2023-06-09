# Welcome!

Welcome to my project! This is a brief overview of what you will find in this repository.

## Table of Contents

- [Introduction](#introduction)
- [Setup](#setup)
  - [Network](#network)
    - [Virtual Network](#virtual-network)
    - [Firewall](#firewall)
    - [Addresses](#addresses)
  - [Machines](#machines)
    - [Database](#database)
    - [Machines Data](#machines-data)
    - [Running Machines](#running-machines)
- [Conclusion](#and-thats-it)

## Introduction

This was a little project of mine. My goal was to set up a simple Kubernetes cluster in GCP using kubeadm, and deploy a simple Node.js app on it that on HTTP get would return the current time and the name of the pod that it was connected to, and send that data to an external database.

## Setup

Here is how to recreate my setup:

### Network

Here is my network setup. Please note that this setup can depend on what kind of machines you are using and what's your network configuration. 

#### Virtual Network

First, let's create a Virtual Network for the cluster.
- Name: `k8s-network`
- Subnet: `main`
  - Region: `europe-north1`
  - IPv4 range: `10.0.0.0/16`

#### Firewall

Here is a simple Firewall config table:

| Rule name                     | Type     | Targets      | Filters     | Protocols / Ports | Action | Priority |
| ---------------------------- | -------- | ------------ | ----------- | ----------------- | ------ | -------- |
| k8s-network-allow-all-local  | Ingress  | Apply to all | 10.0.0.0/16 | all               | Allow  | 65534    |
| k8s-network-allow-ssh        | Ingress  | Apply to all | 0.0.0.0/0   | TCP:22            | Allow  | 65534    |
| k8s-network-allow-app        | Ingress  | Apply to all | 0.0.0.0/0   | TCP:30000         | Allow  | 65534    |

#### Addresses

- Master: `10.0.0.1`
- Slaves: `10.0.0.n+10`

Note: (Don't forget to add a DNS record for `master.k8s`)

### Machines

The setup I was going for by no means demanding, so I went with the minimum.  
All machines had a 20 GB drive with Ubuntu 20.04 installed.

#### Database

Database structure can be basic. It doesn't request a lot of setup. Remember to create a user and save the password.

#### Machines Data

 Master:
  - 2 vCPUs
  - 4 GB ram
 Slaves:
  - 2 vCPUs
  - 2 GB ram

Now that the machines are created we can create a load balancer for the application.  
This balancer will act as an internet gateway.  
So, create an HTTP balancer with a port 80 frontend, and port 30000 backend.  
For a health check create an empty TCP:30000 handshake check.

#### Running Machines

**Run on all machines:**

### Installing dependencies:

```shell
sudo su -
apt update
apt upgrade -y
apt install -y docker.io apt-transport-https ca-certificates curl
```

### Downloading and installing kubernetes components:

```shell
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add
mkdir -p /etc/apt/keyrings/

curl -fsSLo /etc/apt/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

apt-get update
apt-get install -y kubelet kubeadm kubectl
```
&nbsp;
### Now to initialize the cluster run on main:
```shell
echo $'kind: ClusterConfiguration\napiVersion: kubeadm.k8s.io/v1beta3\nkubernetesVersion: v1.27.1\n---\nkind: KubeletConfiguration\napiVersion: kubelet.config.k8s.io/v1beta1\ncgroupDriver: systemd' > k8s-init-config.yaml

kubeadm init --config k8s-init-config.yaml
```

### This will generate a command that should look something like this:
```shell
kubeadm join 10.0.0.1:6443 --token h23k40.kedzrhwkovbodxxc \
        --discovery-token-ca-cert-hash sha256:864fb1522c0a19ec1048499c9af569205ff8aa3abc3355b97782a7e6b04415a4 
```
This is the command for a slave to join the cluster

### Finish creating the cluster and configure kubectl:
```shell
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/
sudo chown $(id -u):$(id -g) $HOME/.kube/config

kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.25.1/manifests/calico-typha.yaml
```
&nbsp;

### To join the cluster execute the kubeadm command that got generated while initializing:
```shell
kubeadm join 10.0.0.1:6443 --token h23k40.kedzrhwkovbodxxc \
        --discovery-token-ca-cert-hash sha256:864fb1522c0a19ec1048499c9af569205ff8aa3abc3355b97782a7e6b04415a4 
```

### And that's it! the cluster has been created

&nbsp;
####  Configure the application

First you'll need to build a docker image of the aplication.  
To do so copy the [container folder](https://github.com/ErmitaVulpe/Fun-with-kubernetes/tree/master/container), go inside of it and run:
```shell
docker build . -t connection-logger:v1.1
docker tag connection-logger:v1.1 <docker_registry>/connection-logger
docker push <docker_registry>/connection-logger
```
You can set up your own registry, which has to have tls, but i just went with docker hub.

&nbsp;
### Now that the image is ready, we can start kubernetes configuration.
First create a secret. To do that copy [this](https://github.com/ErmitaVulpe/Fun-with-kubernetes/blob/master/k8s-config/k8s-sql-secret.yaml) secret config and fill it with your databases base64 encoded credentials.  
Then apply the secret using:
```shell
kubectl apply -f k8s-sql-secret.yaml
```

### now apply aplication config by copying [this file](https://github.com/ErmitaVulpe/Fun-with-kubernetes/blob/master/k8s-config/k8s-config.yaml), and executing:
```shell
kubectl apply -f k8s-config.yaml
```

&nbsp;

## And that's it!
If you did everything exactly as i did and/or no updates broke this config the pods should now be pulling the images and running the aplication.  
Now in your browser paste the load balancers front end IP and it should return you current date as well as the hostname of the pod that you got directed to. If you reload the page a few times, the hostname should change.  
Now copy [checkdb.js](https://github.com/ErmitaVulpe/Fun-with-kubernetes/blob/master/checkdb.js), insert your SQL credentials and run:
```shell
apt install npm -y
npm install mysql
node checkdb.js
```
This should connect to your database and request all the connection logs with a timestamp and the hostname proving that the load balancing works.  
#### If thats the case. Congratulations! you've successuly recreated my kubernetes cluster.
