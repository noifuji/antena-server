var antena = ons.bootstrap('antena', ['onsen']);

antena.controller('MainController', ['$scope', '$http', function($scope, $http) {
    console.log("MainController");

    $scope.entries = [];

    var config = {};
    $http.get("https://antena-noifuji.c9.io/entry?time=0", config)
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
        window.open($scope.entries[index].url);
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