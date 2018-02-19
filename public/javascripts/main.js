var antena = ons.bootstrap('antena', ['onsen'],['ngSanitize']);

antena.controller('MainController', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    console.log("MainController");

    $scope.entries = [];

    var config = {};
    var protocol = location.protocol;
    console.log(protocol);
    var host = location.hostname;
    console.log(host);
    var port = location.port;
    console.log(port);
    $http.get(protocol+"//"+host+":"+port+"/entry?time=0&category=", config)
        .success(function(data, status, headers, config) {
            for(var i = 0; i < data.entries.length; i++) {
                data.entries[i].publicationDate = toLocaleString(new Date(data.entries[i].publicationDate));
            }
            console.log(data);
            $scope.entries = data.entries;
        })
        .error(function(data, status, headers, config) {
            console.log(data);
        });

    $scope.movetoEntry = function(index) {
        //window.open($scope.entries[index].url);
        $http.get(protocol+"//"+host+":"+port+"/description?id="+$scope.entries[index]._id, config)
        .success(function(data, status, headers, config) {
            console.log(data.entry.description);
            $scope.content = $sce.trustAsHtml(data.entry.description);
        })
        .error(function(data, status, headers, config) {
            console.log(data);
        });
    }
}]);

function toLocaleString( date )
{
    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
        ].join( '/' ) + ' '
        + date.toLocaleTimeString();
}