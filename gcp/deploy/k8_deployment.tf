variable "project_id" {
  description = "project id"
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_deployment" "px-deployment" {
  metadata {
    name = "pixelwars-deployment"
    labels = {
      app = "pixelwars-app"
      type = "deployment"
    }
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        app = "pixelwars-app"
        type = "application"
      }
    }

    template {
      metadata {
        labels = {
          app = "pixelwars-app"
          type = "application"
        }
      }

      spec {
        container {
          image = "gcr.io/${var.project_id}/pixelwars:latest"
          name  = "pixelwars"
          command = [ "npm", "start" ]

          resources {
            limits = {
              cpu    = "0.5"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "50Mi"
            }
          }
          }
        }
      }
  }
}

resource "kubernetes_service" "px-service" {
  metadata {
    name = "px-service"
  }
  spec {
    selector = {
      app = "pixelwars-app"
    }
    session_affinity = "ClientIP"
    port {
      name = "web-port"
      port        = 3000
      target_port = 3000
    }

    port {
      name = "socketio-port"
      port = 1337
      target_port = 1337
    }

    type = "ClusterIP"
  }
}


resource "kubernetes_ingress" "px-ingress" {
  wait_for_load_balancer = true
  metadata {
    name = "px-ingress"
    annotations = {
      "kubernetes.io/ingress.class" = "nginx"
    }
  }
  spec {
    rule {
      http {
        path {
          path = "/watch"
          backend {
            service_name = "px-service"
            service_port = 1337
          }
        }
        path {
          path = "/play"
          backend {
            service_name = "px-service"
            service_port = 1337
          }
        }
        path {
          path = "/"
          backend {
            service_name = "px-service"
            service_port = 3000
          }
        }
      }
    }
  }
}