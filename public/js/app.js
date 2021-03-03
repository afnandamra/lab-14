'use strict';
$(function () {
    $('#menuItems').hide();
    $('#menu').click(() => {
        $('#menu').toggleClass('fa-bars');
        $('#menu').toggleClass('fa-times');
        $('#menuItems').toggle();
    })

    $('#editBook').hide();
    $('#edit').click(() => {
        $('#editBook').toggle();
    })

    $('.modal').click(() => {
        $('#editBook').hide();

    })
})