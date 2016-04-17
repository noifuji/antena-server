var antena = ons.bootstrap('antena', ['onsen'],['ngSanitize']);

antena.controller('MainController', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    console.log("MainController");

    $scope.sites = [];

    var config = {};
    
    getAllSites();
    

    $scope.submit = function() {
        $http({
        method: 'POST',
        url: "https://antena-noifuji.c9.io/rss",
        data: { sitetitle: $scope.sitetitle,
                url      : $scope.url}
      })
        .success(function(data, status, headers, config) {
            console.log(data);
            getAllSites();
        })
        .error(function(data, status, headers, config) {
            console.log(data);
        });
    }
    
    $scope.delete = function(index) {
        $http.delete("https://antena-noifuji.c9.io/rss/" + $scope.sites[index]._id, config)
        .success(function(data, status, headers, config) {
            console.log(data);
            getAllSites();
        })
        .error(function(data, status, headers, config) {
            console.log(data);
        });
    }
    
    function getAllSites()
    {
    $http.get("https://antena-noifuji.c9.io/rss", config)
        .success(function(data, status, headers, config) {
            console.log(data);
            $scope.sites = data.sites;
            $scope.sitetitle = "";
            $scope.url = "";
        })
        .error(function(data, status, headers, config) {
            console.log(data);
        });
    }
}]);

